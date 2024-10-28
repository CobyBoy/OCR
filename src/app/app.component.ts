import { AsyncPipe } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { BehaviorSubject, debounceTime, distinctUntilChanged, map, Observable, of, Subject, switchMap } from 'rxjs';
import Tesseract from 'tesseract.js';
import { TypeaheadMatch, TypeaheadModule } from 'ngx-bootstrap/typeahead'
import { TestService } from './test.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, AsyncPipe, ReactiveFormsModule, FormsModule, TypeaheadModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'ocr';
  extractedText: string = '';
  progress: Subject<number> = new Subject<number>();
  searchValue: string = '';
  searchList: Observable<string[]> = new Observable()
  selectedSearchedLocation: any;
  searchSubject = new Subject<string>();
  propertyId = 0;
  selectedFloor = 'floor';
  service = inject(TestService);

  ngAfterViewInit() {
    this.progress.next(0);
  }

  ngOnInit() {
    this.searchList = this.searchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap((text: string) => this.searchLocation(text))
    );
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
          logger: (m) => {
            if (m.status === 'recognizing text') {
              this.progress.next(Number(`${Math.round(m.progress * 100)}`));
              console.log(m)
            }
          }, // Logs progress information
        }).then(({ data: { text } }) => {
          this.searchValue = text.trim();  // Store the extracted text
          console.log('Extracted text:', this.searchValue);
          this.search();
          // You can now use this.extractedText to search or add to your list
        });
      };

      reader.readAsDataURL(file);
    }
  }

  onSelectSearchedLocation(event: TypeaheadMatch<any>) {
    this.selectedSearchedLocation = event.item;
  }

  search() {
    this.searchSubject.next(this.searchValue);
  }

  private searchLocation(text: string): Observable<string[]> {
    return this.service.searchSpaces(this.propertyId, text, this.selectedFloor).pipe(
      map(response => this.buildSearchList(response))
    );
  }

  private buildSearchList(content: string[]): string[] {
    console.log(content.filter(state => state.toLowerCase().includes(this.searchValue.toLowerCase())))
    return content;
  }
}
