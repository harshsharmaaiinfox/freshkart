import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-term-condition',
  standalone: true,
  imports: [],
  templateUrl: './term-condition.component.html',
  styleUrl: './term-condition.component.scss'
})
export class TermConditionComponent implements OnInit {

  ngOnInit(): void {
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
