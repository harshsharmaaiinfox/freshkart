import { Component, OnInit } from '@angular/core';
import { SeoService } from '../../shared/services/seo.service';

@Component({
  selector: 'app-privacy-policy',
  standalone: true,
  imports: [],
  templateUrl: './privacy-policy.component.html',
  styleUrl: './privacy-policy.component.scss'
})
export class PrivacyPolicyComponent implements OnInit {

  constructor(private seoService: SeoService) { }

  ngOnInit() {
    // Set unique SEO data for Privacy Policy page
    this.seoService.setSEOData({
      title: 'Privacy Policy – How We Use Your Data | RaylomShop',
      description: 'Learn how RaylomShop protects and uses your personal information. Read our comprehensive privacy policy to understand your rights and our data practices.',
      keywords: 'privacy policy, data protection, personal information, RaylomShop privacy, data usage',
      canonicalUrl: 'https://raylomshop.com/privacy-policy', // ✅ Canonical URL for SEO
      url: 'https://raylomshop.com/privacy-policy',
      type: 'website'
    });

    // Set current date
    this.setCurrentDate();
  }

  setCurrentDate(): void {
    const dateElement = document.getElementById('currentDate');
    if (dateElement) {
      const today = new Date();
      const options: Intl.DateTimeFormatOptions = {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      };
      dateElement.textContent = today.toLocaleDateString('en-US', options);
    }
  }
}
