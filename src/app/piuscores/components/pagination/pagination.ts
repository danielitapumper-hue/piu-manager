import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.html',
})
export class Pagination {
  private readonly maxVisiblePages = 1;
  private readonly ellipsis = 'ellipsis' as const;

  currentPage = input<number>(1);
  totalPages = input<number>(0);
  activePage = output<number>();

  visiblePages = computed(() => {
    const totalPages = this.totalPages();

    if (totalPages <= this.maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const half = Math.floor(this.maxVisiblePages / 2);
    let start = this.currentPage() - half;
    let end = this.currentPage() + half;

    if (this.currentPage() <= half + 1) {
      start = 1;
      end = this.maxVisiblePages;
    } else if (this.currentPage() >= totalPages - half) {
      start = totalPages - this.maxVisiblePages + 1;
      end = totalPages;
    }

    const items: Array<number | typeof this.ellipsis> = [];

    if (start > 1) {
      items.push(1, this.ellipsis);
    }

    for (let page = start; page <= end; page++) {
      items.push(page);
    }

    if (end < totalPages) {
      items.push(this.ellipsis, totalPages);
    }

    return items;
  });

  goToPage(page: number): void {
    if (page < 1 || page > this.totalPages()) {
      return;
    }

    this.activePage.emit(page);
  }

  goToPrevPage(): void {
    this.goToPage(this.currentPage() - 1);
  }

  goToNextPage(): void {
    this.goToPage(this.currentPage() + 1);
  }
}
