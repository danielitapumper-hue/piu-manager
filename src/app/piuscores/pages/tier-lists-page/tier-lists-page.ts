import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
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
  //Injectables
  piuScoresService = inject(PiuscoresService);
  fb = inject(FormBuilder);

  //Data
  tierList = signal<TierListResponse[]>([]);
  tierListBySongTypes = computed(() => {
    const songTypes = this.tierListForm.value.songTypes;
    if (!songTypes)
      return this.tierList();

    const selectedSongTypes = this.piuScoresService.songTypes.filter((_, i) => songTypes![i]);
    return this.tierList()
      .filter(item => selectedSongTypes.includes(item.chart.song.type));
  });

  //Form
  tierListForm = this.fb.group({
    chartType: ['Single', [Validators.required, Validators.pattern(/Single|Double/)]],
    level: [1, [Validators.required, Validators.min(1), Validators.max(29)]],
    songTypes: this.fb.array(
      this.piuScoresService.songTypes.map((songType, index) => index === 0),
      [Validators.required, Validators.minLength(1)]
    )
  });

  onSearch() {
    if (this.tierListForm.invalid)
      return;

    const { chartType, level } = this.tierListForm.value;
    this.piuScoresService.getTierListByScores(chartType!, level!)
      .subscribe(resp => { this.tierList.set(resp); });
  }

  getTierListByCategory(category: Category): Chart[] {
    return this.tierListBySongTypes()
      .filter(item => item.category === category)
      .map(item => item.chart);
  }
}
