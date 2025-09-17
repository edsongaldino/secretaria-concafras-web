import { Component } from '@angular/core';
import { NgFor } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { StatusCardComponent } from '../../widgets/status-card.component';
import { NgxEchartsModule } from 'ngx-echarts';
import type { EChartsOption } from 'echarts';

@Component({
  standalone: true,
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss'],
  imports: [NgFor, MatCardModule, MatProgressBarModule, StatusCardComponent, NgxEchartsModule]
})
export class DashboardComponent {
  sources = [
    { name: 'Direct', value: 80 },
    { name: 'Social', value: 50 },
    { name: 'Referral', value: 20 },
    { name: 'Bounce', value: 60 },
    { name: 'Internet', value: 40 },
  ];

  lineOptions: EChartsOption = {
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'category', data: ['Seg','Ter','Qua','Qui','Sex','Sáb','Dom'] },
    yAxis: { type: 'value' },
    series: [{ type: 'line', smooth: true, areaStyle: {}, data: [120, 200, 150, 80, 70, 110, 130] }],
    grid: { left: 30, right: 10, top: 24, bottom: 24 }
  };

  pieOptions: EChartsOption = {
    tooltip: { trigger: 'item' },
    legend: { bottom: 0 },
    series: [{
      type: 'pie', radius: ['40%','70%'], avoidLabelOverlap: false,
      data: [
        { value: 1048, name: 'YouTube' },
        { value: 735, name: 'Facebook' },
        { value: 580, name: 'Twitter' }
      ]
    }]
  };
}
