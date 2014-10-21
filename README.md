Google Chart Tools Directive Module
============================
for AngularJS
-------------

Based on Nicolas Bouillon <nicolas@bouil.org> [angular-google-chart](https://github.com/bouil/angular-google-chart)
but added controllers.

Controllers and Charts is part of a dashboard

### Sample
```html
<google-dashboard dashboard="dashboard">
      <google-chart chart="chart1" on-select="onSelected(selectedItem)"></google-chart>
      <google-chart(chart="chart2" on-select="onSelected(selectedItem)"></google-chart>
      <google-controller(controller="controller" style="height:50px"></google-controller>
</google-dashboard>
```