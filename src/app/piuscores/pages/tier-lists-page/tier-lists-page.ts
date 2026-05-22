import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { CategoryChart } from '@piuscores/interfaces/category-chart';
import { Category, Chart } from '@piuscores/interfaces/piuscores-interfaces';
import { TierListResponse } from '@piuscores/interfaces/tier-list-response';
import { PiuscoresService } from '@piuscores/services/piuscores-service';
import { SongCard } from '@songs/components/song-card/song-card';

@Component({
  selector: 'app-tier-lists-page',
  imports: [ReactiveFormsModule, SongCard],
  templateUrl: './tier-lists-page.html',
})
export class TierListsPage {
  piuScoresService = inject(PiuscoresService);
  fb = inject(FormBuilder);

  private tierList: TierListResponse[] = [];

  tierListByCategories = signal<CategoryChart[]>([]);

  tierListForm = this.fb.group({
    chartType: ['Single', [Validators.required, Validators.pattern(/Single|Double/)]],
    level: [1, [Validators.required, Validators.min(1), Validators.max(29)]],
    songTypes: this.fb.array(
      this.piuScoresService.songTypes.map((songType, index) => index === 0),
      [Validators.required, Validators.minLength(1)]
    )
  });

  songTypesChanged = this.tierListForm.get('songTypes')!.valueChanges
    .subscribe((valor) => {
      console.log('songTypes changed', this.tierListForm.value.songTypes);
      console.log('songTypes changed', valor);
      this.tierListByCategories.set(this.getTierListByCategories(valor));
    });

  onSearch() {
    if (this.tierListForm.invalid)
      return;

    const { chartType, level, songTypes } = this.tierListForm.value;
    this.piuScoresService.getTierListByScores(chartType!, level!)
      .subscribe(resp => {
        this.tierList = resp;
        this.tierListByCategories.set(this.getTierListByCategories(songTypes!));
      });
  }

  private getTierListByCategories(songTypes: (boolean | null)[] | null): CategoryChart[] {
    const tierListByCategories: CategoryChart[] = [];
    const tierListBySongTypes = this.getTierListBySongTypes(songTypes);

    for (const category of this.piuScoresService.categories) {
      tierListByCategories.push({
        category: category,
        charts: this.getTierListByCategory(category, tierListBySongTypes)
      });
    }

    return tierListByCategories;
  }

  private getTierListBySongTypes(songTypes: (boolean | null)[] | null): TierListResponse[] {
    if (!songTypes)
      return this.tierList;

    const selectedSongTypes = this.piuScoresService.songTypes.filter((_, i) => songTypes![i]);
    return this.tierList
      .filter(item => selectedSongTypes.includes(item.chart.song.type));
  };

  private getTierListByCategory(category: Category, tierListBySongTypes: TierListResponse[]): Chart[] {
    return tierListBySongTypes
      .filter(item => item.category === category)
      .map(item => item.chart);
  }
}
