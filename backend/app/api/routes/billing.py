from fastapi import APIRouter, Depends, HTTPException, Request, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_active_admin, get_current_user
from app.models.user import User
from app.models.organization import Organization
from app.core.config import settings

router = APIRouter(prefix="/billing", tags=["Billing"])

PLANS = {
    "free": {"name": "Free", "max_apartments": 3, "price_cents": 0, "price_label": "Grátis"},
    "basic": {"name": "Basic", "max_apartments": 10, "price_cents": 9900, "price_label": "R$ 99/mês"},
    "pro": {"name": "Pro", "max_apartments": 9999, "price_cents": 19900, "price_label": "R$ 199/mês"},
}

def _get_org(db, current_user: User) -> Organization:
    org_id = current_user.organization_id or 1
    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        raise HTTPException(status_code=404, detail="Organização não encontrada")
    return org


@router.get("/plans")
def list_plans(current_user: User = Depends(get_current_user)):
    """Listar planos disponíveis"""
    return [
        {"id": k, **v}
        for k, v in PLANS.items()
    ]


@router.get("/subscription")
def get_subscription(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    """Status da assinatura da organização"""
    org = _get_org(db, current_user)
    plan = PLANS.get(org.plan or "free", PLANS["free"])
    return {
        "organization_id": org.id,
        "plan": org.plan or "free",
        "plan_name": plan["name"],
        "max_apartments": plan["max_apartments"],
        "price_label": plan["price_label"],
        "subscription_status": org.subscription_status or "inactive",
        "stripe_customer_id": bool(org.stripe_customer_id),
    }


@router.post("/create-checkout-session")
def create_checkout_session(
    plan: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Criar sessão de checkout do Stripe (apenas Admin)"""
    if plan not in ("basic", "pro"):
        raise HTTPException(status_code=400, detail="Plano inválido. Use basic ou pro")
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing não configurado (STRIPE_SECRET_KEY ausente). Configure as chaves de teste do Stripe no .env/Railway.")

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY

    org = _get_org(db, current_user)
    price_id = settings.STRIPE_PRICE_BASIC if plan == "basic" else settings.STRIPE_PRICE_PRO

    # Se não houver price_id configurado, criar com price_data inline (modo teste)
    # IMPORTANTE: inclui {CHECKOUT_SESSION_ID} para o frontend poder verificar sem webhook
    success_url = settings.STRIPE_SUCCESS_URL or f"{settings.FRONTEND_URL}/billing?success=1&session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = settings.STRIPE_CANCEL_URL or f"{settings.FRONTEND_URL}/billing?canceled=1"

    # Criar ou recuperar customer
    customer_id = org.stripe_customer_id
    if not customer_id:
        customer = stripe.Customer.create(
            email=current_user.username if "@" in current_user.username else None,
            name=org.name,
            metadata={"organization_id": str(org.id), "user_id": str(current_user.id)},
        )
        customer_id = customer.id
        org.stripe_customer_id = customer_id
        db.commit()

    kwargs = {
        "customer": customer_id,
        "mode": "subscription",
        "success_url": success_url,
        "cancel_url": cancel_url,
        "metadata": {"organization_id": str(org.id), "plan": plan},
        "client_reference_id": str(org.id),
    }
    if price_id:
        kwargs["line_items"] = [{"price": price_id, "quantity": 1}]
    else:
        # Fallback inline price (teste sem criar produto no dashboard)
        plan_info = PLANS[plan]
        kwargs["line_items"] = [{
            "price_data": {
                "currency": "brl",
                "product_data": {"name": f"Verus Sweeply - {plan_info['name']}"},
                "unit_amount": plan_info["price_cents"],
                "recurring": {"interval": "month"},
            },
            "quantity": 1,
        }]

    session = stripe.checkout.Session.create(**kwargs)
    return {"url": session.url, "session_id": session.id}


@router.post("/webhook", include_in_schema=False)
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    """Webhook do Stripe — atualiza assinatura da organização"""
    if not settings.STRIPE_SECRET_KEY or not settings.STRIPE_WEBHOOK_SECRET:
        raise HTTPException(status_code=503, detail="Webhook não configurado")

    import stripe
    payload = await request.body()
    sig = request.headers.get("stripe-signature", "")
    try:
        event = stripe.Webhook.construct_event(payload, sig, settings.STRIPE_WEBHOOK_SECRET)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Webhook error: {str(e)}")

    etype = event.get("type")
    obj = event.get("data", {}).get("object", {})

    # Mapear evento -> organização
    org_id = None
    if obj.get("metadata", {}).get("organization_id"):
        org_id = int(obj["metadata"]["organization_id"])
    elif obj.get("client_reference_id"):
        try:
            org_id = int(obj["client_reference_id"])
        except: pass
    elif obj.get("customer"):
        # Buscar por stripe_customer_id
        cust = obj.get("customer")
        org = db.query(Organization).filter(Organization.stripe_customer_id == cust).first()
        if org:
            org_id = org.id

    if not org_id:
        return {"received": True, "note": "org not found, ignored"}

    org = db.query(Organization).filter(Organization.id == org_id).first()
    if not org:
        return {"received": True}

    if etype == "checkout.session.completed":
        plan = obj.get("metadata", {}).get("plan") or "basic"
        org.plan = plan
        org.subscription_status = "active"
        if obj.get("subscription"):
            org.stripe_subscription_id = obj["subscription"]
        db.commit()
    elif etype in ("customer.subscription.updated", "customer.subscription.created"):
        status = obj.get("status")
        # stripe status: active, past_due, canceled, unpaid
        org.subscription_status = status or org.subscription_status
        if obj.get("id"):
            org.stripe_subscription_id = obj["id"]
        # Se ativo, garantir plano (inferir pelo price)
        if status == "active" and org.plan == "free":
            org.plan = "basic"
        db.commit()
    elif etype == "customer.subscription.deleted":
        org.subscription_status = "canceled"
        org.plan = "free"
        db.commit()

    return {"received": True}


@router.post("/verify-session")
def verify_session(
    session_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Verifica sessão do Stripe sem webhook — para teste. Atualiza plano se pagamento confirmado."""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing não configurado")
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        session = stripe.checkout.Session.retrieve(session_id)
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Sessão inválida: {str(e)}")
    if session.get("payment_status") != "paid":
        raise HTTPException(status_code=400, detail="Pagamento ainda não confirmado")
    org = _get_org(db, current_user)
    # Validar que a sessão pertence à mesma org (via metadata ou customer)
    meta_org = session.get("metadata", {}).get("organization_id")
    if meta_org and int(meta_org) != org.id:
        raise HTTPException(status_code=403, detail="Sessão não pertence a esta organização")
    plan = session.get("metadata", {}).get("plan") or "basic"
    org.plan = plan
    org.subscription_status = "active"
    if session.get("subscription"):
        org.stripe_subscription_id = session["subscription"]
    if session.get("customer"):
        org.stripe_customer_id = session["customer"]
    db.commit()
    return {"plan": org.plan, "status": org.subscription_status}


@router.post("/portal")
def create_portal_session(db: Session = Depends(get_db), current_user: User = Depends(get_current_active_admin)):
    """Portal do cliente Stripe (gerenciar/cancelar assinatura)"""
    if not settings.STRIPE_SECRET_KEY:
        raise HTTPException(status_code=503, detail="Billing não configurado")
    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    org = _get_org(db, current_user)
    if not org.stripe_customer_id:
        raise HTTPException(status_code=400, detail="Nenhuma assinatura encontrada")
    return_url = settings.FRONTEND_URL + "/billing"
    session = stripe.billing_portal.Session.create(customer=org.stripe_customer_id, return_url=return_url)
    return {"url": session.url}
