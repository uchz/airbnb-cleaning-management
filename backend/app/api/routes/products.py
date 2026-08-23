from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.api.deps import get_current_user, get_current_active_admin
from app.models.user import User
from app.models.product import Product
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
)

router = APIRouter(prefix="/products", tags=["Products"])


def _to_response(product: Product) -> ProductResponse:
    is_low = product.min_quantity > 0 and product.quantity <= product.min_quantity
    return ProductResponse(
        id=product.id,
        name=product.name,
        quantity=product.quantity,
        unit=product.unit,
        min_quantity=product.min_quantity,
        observations=product.observations,
        is_low_stock=is_low,
        created_at=product.created_at,
        updated_at=product.updated_at,
    )


@router.get("/", response_model=List[ProductResponse])
def list_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar produtos do estoque (da organização)"""
    org_id = current_user.organization_id or 1
    products = db.query(Product).filter(Product.organization_id == org_id).order_by(Product.name).all()
    return [_to_response(p) for p in products]


@router.get("/low-stock", response_model=List[ProductResponse])
def low_stock_products(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Listar produtos com estoque baixo (da organização)"""
    org_id = current_user.organization_id or 1
    products = db.query(Product).filter(Product.organization_id == org_id, Product.min_quantity > 0).all()
    return [_to_response(p) for p in products if p.quantity <= p.min_quantity]


@router.post("/", response_model=ProductResponse, status_code=status.HTTP_201_CREATED)
def create_product(
    data: ProductCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Criar produto (apenas Admin)"""
    org_id = current_user.organization_id or 1
    product = Product(**data.model_dump(), organization_id=org_id)
    db.add(product)
    db.commit()
    db.refresh(product)
    return _to_response(product)


@router.put("/{product_id}", response_model=ProductResponse)
def update_product(
    product_id: int,
    data: ProductUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Atualizar produto (apenas Admin)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    
    for key, value in data.model_dump(exclude_unset=True).items():
        setattr(product, key, value)
    
    db.commit()
    db.refresh(product)
    return _to_response(product)


@router.delete("/{product_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_product(
    product_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_active_admin)
):
    """Excluir produto (apenas Admin)"""
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Produto não encontrado")
    db.delete(product)
    db.commit()
    return None