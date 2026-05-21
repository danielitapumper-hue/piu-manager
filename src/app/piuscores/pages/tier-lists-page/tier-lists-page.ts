import { Component, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { ChartType } from '@piuscores/interfaces/piuscores-interfaces';
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

  //Form
  tierListForm = this.fb.group({
    chartType: ['Single', [Validators.required, Validators.pattern(/Single|Double/)]],
    level: [1, [Validators.required, Validators.min(1), Validators.max(29)]],
    songTypes: this.fb.array(
      this.piuScoresService.getSongTypes().map((songType, index) => index === 0),
      [Validators.required, Validators.minLength(1)]
    )
  });

  onSearch() {
    if (this.tierListForm.invalid) {
      return;
    }

    const { chartType, level, songTypes } = this.tierListForm.value;
    // Filtrar los songTypes seleccionados (donde songTypes[i] === true)
    const selectedSongTypes = this.piuScoresService.getSongTypes().filter((_, i) => songTypes![i]);

    console.log({ chartType, level, songTypes, selectedSongTypes });

    this.piuScoresService.getTierListByScores(chartType!, level!).subscribe(resp => {
      this.tierList.set(resp);
      // this.tierList.set(resp.filter(item => selectedSongTypes.includes(item.chart.type.toString())));
    });
  }
}
