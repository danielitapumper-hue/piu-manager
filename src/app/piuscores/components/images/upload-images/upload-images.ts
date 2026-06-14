import { Component, output, signal } from '@angular/core';

@Component({
  selector: 'upload-images',
  imports: [],
  templateUrl: './upload-images.html',
})
export class UploadImages {
  isDragOver = signal<boolean>(false);
  files = output<FileList>();

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragOver.set(false);
    if (event.dataTransfer?.files) {
      this.files.emit(event.dataTransfer.files);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.files.emit(input.files);
    }
  }
}
