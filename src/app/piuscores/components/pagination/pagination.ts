import { Component, computed, input, output } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-pagination',
  imports: [RouterLink],
  templateUrl: './pagination.html',
})
export class Pagination {
  private readonly maxVisiblePages = 3;
  private readonly ellipsis = 'ellipsis' as const;

  currentPage = input<number>(1);
  totalPages = input<number>(0);
  activePage = output<number>();

  visiblePages = computed(() => {
    const totalPages = this.totalPages();

    if (totalPages <= this.maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const currentPage = this.currentPage();

    if (currentPage <= 2) {
      return [1, 2, 3, this.ellipsis, totalPages];
    }

    if (currentPage >= totalPages - 1) {
      return [1, this.ellipsis, totalPages - 2, totalPages - 1, totalPages];
    }

    return [1, this.ellipsis, currentPage - 1, currentPage, currentPage + 1, this.ellipsis, totalPages];
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
