import { Component, Input, HostListener, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { Option } from '../../../interface/theme-option.interface';

@Component({
  selector: 'app-basic-header',
  templateUrl: './basic-header.component.html',
  styleUrls: ['./basic-header.component.scss']
})
export class BasicHeaderComponent implements OnInit, OnDestroy {

  @Input() data: Option | null;
  @Input() logo: string | null | undefined;
  @Input() sticky: boolean | number | undefined; // Default false
  @Input() class: string | undefined;

  public stick: boolean = false;
  public active: boolean = false;
  public isHomePage: boolean = false;

  private destroy$ = new Subject<void>();

  constructor(private router: Router) {}

  ngOnInit(): void {
    this.updateHomeState(this.router.url);

    this.router.events
      .pipe(
        filter((event): event is NavigationEnd => event instanceof NavigationEnd),
        takeUntil(this.destroy$)
      )
      .subscribe((event) => this.updateHomeState(event.urlAfterRedirects));
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // @HostListener Decorator
  @HostListener("window:scroll", [])
  onWindowScroll() {
    let number = window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0;
  	if (number >= 150 && window.innerWidth > 400) {
  	  this.stick = true;
  	} else {
  	  this.stick = false;
  	}
  }

  toggle(val: boolean){
    this.active = val;
  }

  private updateHomeState(url: string): void {
    const normalizedUrl = url.split('?')[0] || '/';
    this.isHomePage = normalizedUrl === '/' || normalizedUrl === '/home';
  }
}
