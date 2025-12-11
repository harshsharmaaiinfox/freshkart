import { HttpClient } from "@angular/common/http";
import { Injectable } from "@angular/core";
import { Observable, Subject } from "rxjs";
import { environment } from "../../../environments/environment";
import { Cart, CartAddOrUpdate, CartModel } from "../interface/cart.interface";


@Injectable({
  providedIn: "root",
})
export class CartService {

  private subjectQty = new Subject<boolean>();
  private paymentReturnSubject = new Subject<{ uuid: string, method: string, payload: any }>();

  constructor(private http: HttpClient) { }

  getCartItems(): Observable<CartModel> {
    return this.http.get<CartModel>(`${environment.URL}/cart`);
  }

  addToCart(payload: CartAddOrUpdate): Observable<CartModel> {
    return this.http.post<CartModel>(`${environment.URL}/cart`, payload);
  }

  updateQty() {
    this.subjectQty.next(true);
  }

  getUpdateQtyClickEvent(): Observable<boolean> {
    return this.subjectQty.asObservable();
  }

  updateCart(payload: CartAddOrUpdate): Observable<CartModel> {
    return this.http.put<CartModel>(`${environment.URL}/cart`, payload);
  }

  replaceCart(payload: CartAddOrUpdate): Observable<CartModel> {
    return this.http.put<CartModel>(`${environment.URL}/replace/cart`, payload);
  }

  deleteCart(id: number): Observable<number> {
    return this.http.delete<number>(`${environment.URL}/cart/${id}`);
  }

  clearCart() {
    return this.http.delete<number>(`${environment.URL}/clear/cart`);
  }

  syncCart(payload: CartAddOrUpdate[]): Observable<CartModel> {
    return this.http.post<CartModel>(`${environment.URL}/sync/cart`, payload);
  }

  initiateSubPaisa(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json' // Ensure JSON data format
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateNeoKredIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/newcred-initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  checkTransectionStatusNeoKred(uuid: any, payment_method: string) {
    return this.http.post<any>(`${environment.URL}/check-payment-response`, { uuid: uuid, payment_method });
  }

  initiateCashFreeIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/generate-cash-free`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateZyaadaPayIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/zyaadapaisa-initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateEaseBuzzIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/ease-buzz-initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateNeoKred2Intent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/newcred-initiate-payment2`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      })
        .then(response => response.json())
        .then(data => {
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          observer.error(error);
        });
    });
  }

  initiateORDINOMENabuIntent(data: any): Observable<any> {
    return new Observable(observer => {
      fetch(`${environment.URL}/ORDINOME-nabu-initiate-payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
        .then(async (res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}: ${await res.text()}`);
          return res.json();
        })
        .then(data => { observer.next(data); observer.complete(); })
        .catch(err => observer.error(err));
    });
  }

  initiateDeluxePayIntent(data: any): Observable<any> {
    return new Observable(observer => {
      // Prepare the payload - exact structure matching working Postman example
      // Must include: uuid, email, total, phone, name, address
      const payload: any = {};
      
      // UUID - must be string
      if (data.uuid) {
        payload.uuid = String(data.uuid).trim();
      }
      
      // Email - must be string
      if (data.email) {
        payload.email = String(data.email).trim();
      }
      
      // Total - must be number (not string)
      if (data.total !== undefined && data.total !== null) {
        const totalNum = typeof data.total === 'string' ? parseFloat(data.total) : Number(data.total);
        if (!isNaN(totalNum)) {
          payload.total = totalNum;
        }
      }
      
      // Phone - must be pure number (not string) like 8525000120
      if (data.phone !== undefined && data.phone !== null && data.phone !== '') {
        // Remove all non-numeric characters and convert to number
        const phoneStr = String(data.phone).replace(/\D/g, '');
        if (phoneStr && phoneStr.length > 0) {
          payload.phone = parseInt(phoneStr, 10);
        }
      }
      
      // Name - must be string
      if (data.name) {
        payload.name = String(data.name).trim();
      }
      
      // Address - must be string
      if (data.address) {
        payload.address = String(data.address).trim();
      }

      // Validate all required fields are present
      const requiredFields = ['uuid', 'email', 'total', 'phone', 'name', 'address'];
      const missingFields = requiredFields.filter(field => !payload[field] && payload[field] !== 0);
      
      if (missingFields.length > 0) {
        console.error('DeluxePay: Missing required fields:', missingFields);
        observer.error(new Error(`Missing required fields: ${missingFields.join(', ')}`));
        return;
      }

      // Log the request data for debugging - show exact JSON that will be sent
      console.log('DeluxePay API Request:', {
        url: `${environment.URL}/deluxepay-initiate-payment`,
        payload: payload,
        payloadJSON: JSON.stringify(payload)
      });

      fetch(`${environment.URL}/deluxepay-initiate-payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify(payload)
      })
        .then(async (response) => {
          const responseText = await response.text();
          let responseData;
          
          try {
            responseData = JSON.parse(responseText);
          } catch (e) {
            responseData = { raw: responseText };
          }
          
          // Log full response for debugging
          console.log('DeluxePay API Response:', {
            status: response.status,
            statusText: response.statusText,
            body: responseData,
            rawText: responseText
          });
          
          // Check if response indicates failure
          if (!response.ok) {
            console.error('DeluxePay API HTTP Error:', {
              status: response.status,
              statusText: response.statusText,
              body: responseData
            });
            throw new Error(`HTTP ${response.status}: ${JSON.stringify(responseData)}`);
          }
          
          // Check if API returned error in response body (like {"R":false,"msg":"No Data"})
          if (responseData && responseData.R === false) {
            console.error('DeluxePay API Business Logic Error:', {
              message: responseData.msg,
              fullResponse: responseData,
              sentPayload: payload
            });
            throw new Error(responseData.msg || 'Payment initiation failed');
          }
          
          return responseData;
        })
        .then(data => {
          console.log('DeluxePay API Success Response:', data);
          observer.next(data);
          observer.complete();
        })
        .catch(error => {
          console.error('DeluxePay API Request Failed:', error);
          observer.error(error);
        });
    });
  }

}
