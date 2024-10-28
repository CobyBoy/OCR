import { AsyncPipe, NgIf } from '@angular/common';
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import Tesseract from 'tesseract.js';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, NgIf, AsyncPipe],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ocr';
  extractedText: string = '';
  progress: Subject<number> = new Subject<number>();

  ngAfterViewInit() {
    this.progress.next(0);
  }

  
  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      const file = input.files[0];
      const reader = new FileReader();

      reader.onload = () => {
        const imageSrc = reader.result as string;

        // Perform OCR using Tesseract.js
        Tesseract.recognize(imageSrc, 'eng', {
          logger: (m) => { console.log(m); if (m.status === 'recognizing text')  this.progress.next(Number(`${Math.round(m.progress * 100)}`)) }, // Logs progress information
        }).then(({ data: { text } }) => {
          this.extractedText = text.trim();  // Store the extracted text
          console.log('Extracted text:', this.extractedText);
          // You can now use this.extractedText to search or add to your list
        });
      };

      reader.readAsDataURL(file);
    }
  }
}
