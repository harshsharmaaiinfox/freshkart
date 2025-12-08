import { Component, OnInit, AfterViewInit } from '@angular/core';

@Component({
  selector: 'app-about-us-page',
  templateUrl: './about-us-page.component.html',
  styleUrl: './about-us-page.component.scss'
})
export class AboutUsPageComponent implements OnInit, AfterViewInit {

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.animateNumbers();
  }

  animateNumbers(): void {
    const observerOptions = {
      threshold: 0.5,
      rootMargin: '0px'
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement;
          const count = parseFloat(target.getAttribute('data-count') || '0');
          const suffix = target.nextElementSibling?.textContent || '';
          const isDecimal = count % 1 !== 0;
          
          this.countUp(target, count, isDecimal, suffix);
          observer.unobserve(target);
        }
      });
    }, observerOptions);

    // Observe all stat numbers
    setTimeout(() => {
      const statNumbers = document.querySelectorAll('.stat-number');
      statNumbers.forEach(stat => observer.observe(stat));
    }, 100);
  }

  countUp(element: HTMLElement, target: number, isDecimal: boolean, suffix: string): void {
    const duration = 2000; // 2 seconds
    const steps = 60;
    const increment = target / steps;
    let current = 0;
    const stepDuration = duration / steps;

    const timer = setInterval(() => {
      current += increment;
      if (current >= target) {
        current = target;
        clearInterval(timer);
      }
      
      if (isDecimal) {
        element.textContent = current.toFixed(1);
      } else {
        element.textContent = Math.floor(current).toString();
      }
    }, stepDuration);
  }
}
