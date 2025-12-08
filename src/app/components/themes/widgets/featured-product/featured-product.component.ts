import { Component, Input, OnInit } from '@angular/core';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { Product, Variation } from '../../../../shared/interface/product.interface';
import { Cart, CartAddOrUpdate } from '../../../../shared/interface/cart.interface';
import { AddToCart } from '../../../../shared/action/cart.action';
import { CartState } from '../../../../shared/state/cart.state';
import * as data from '../../../../shared/data/owl-carousel';

@Component({
    selector: 'app-featured-product',
    templateUrl: './featured-product.component.html',
    styleUrls: ['./featured-product.component.scss']
})
export class FeaturedProductComponent implements OnInit {

    @Input() product: Product;

    @Select(CartState.cartItems) cartItem$: Observable<Cart[]>;

    public cartItem: Cart | null;
    public productQty: number = 1;
    public selectedVariation: Variation | null;
    public activeSlide: string = '0';
    public totalPrice: number = 0;

    public productMainThumbSlider = data.productMainThumbSlider;
    public productThumbSlider = data.productThumbSlider;

    public videType = ['video/mp4', 'video/webm', 'video/ogg'];
    public audioType = ['audio/mpeg', 'audio/wav', 'audio/ogg'];

    constructor(private store: Store) { }

    ngOnInit() {
        if (this.product) {
            this.cartItem$.subscribe(items => {
                this.cartItem = items.find(item => item.product.id == this.product.id)!;
            });
            this.wholesalePriceCal();
        }
    }

    selectVariation(variation: Variation) {
        this.selectedVariation = variation;
        this.wholesalePriceCal();
    }

    updateQuantity(qty: number) {
        if (1 > this.productQty + (qty)) return;
        this.productQty = this.productQty + (qty);
        this.wholesalePriceCal();
    }

    wholesalePriceCal() {
        if (!this.product) return;
        let wholesale = this.product.wholesales?.find(value => value.min_qty <= this.productQty && value.max_qty >= this.productQty) || null;
        if (wholesale && this.product.wholesale_price_type == 'fixed') {
            this.totalPrice = this.productQty * wholesale.value;
        } else if (wholesale && this.product.wholesale_price_type == 'percentage') {
            this.totalPrice = this.productQty * (this.selectedVariation ? this.selectedVariation.sale_price : this.product.sale_price);
            this.totalPrice = this.totalPrice - (this.totalPrice * (wholesale.value / 100));
        } else {
            this.totalPrice = this.productQty * (this.selectedVariation ? this.selectedVariation.sale_price : this.product.sale_price);
        }
    }

    addToCart(product: Product) {
        if (product) {
            const params: CartAddOrUpdate = {
                id: this.cartItem && (this.selectedVariation && this.cartItem?.variation &&
                    this.selectedVariation?.id == this.cartItem?.variation?.id) ? this.cartItem.id : null,
                product_id: product?.id!,
                product: product ? product : null,
                variation: this.selectedVariation ? this.selectedVariation : null,
                variation_id: this.selectedVariation?.id ? this.selectedVariation?.id! : null,
                quantity: this.productQty
            }
            this.store.dispatch(new AddToCart(params));
        }
    }

    externalProductLink(link: string) {
        if (link) {
            window.open(link, "_blank");
        }
    }
}
