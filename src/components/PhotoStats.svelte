<script>
  import { onMount, onDestroy } from "svelte";
  import { cubicOut } from "svelte/easing";
  import {
    Chart,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    ArcElement,
    LineController,
    BarController,
    DoughnutController,
    PieController,
  } from "chart.js";
  import "chartjs-adapter-date-fns";

  Chart.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    TimeScale,
    ArcElement,
    LineController,
    BarController,
    DoughnutController,
    PieController
  );

  export let photoStats;

  let photosByYearChart = null;
  let photosByMonthChart = null;
  let camerasChart = null;
  let lensesChart = null;
  let isoChart = null;
  let aperturesChart = null;
  let focalLengthsChart = null;

  let photosByYearCanvas;
  let photosByMonthCanvas;
  let camerasCanvas;
  let lensesCanvas;
  let isoCanvas;
  let aperturesCanvas;
  let focalLengthsCanvas;

  const colors = {
    primary: '#3B82F6',
    secondary: '#8B5CF6',
    success: '#10B981',
    warning: '#F59E0B',
    pink: '#EC4899'
  };

  const createGradient = (ctx, colors, direction = 'vertical') => {
    const gradient = direction === 'vertical'
      ? ctx.createLinearGradient(0, 0, 0, 400)
      : ctx.createLinearGradient(0, 0, 400, 0);
    gradient.addColorStop(0, colors[0]);
    gradient.addColorStop(1, colors[1]);
    return gradient;
  };

  const defaultChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: { size: 12, weight: '500' },
          color: '#4B5563'
        }
      },
      tooltip: {
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#F9FAFB',
        bodyColor: '#F3F4F6',
        borderColor: 'rgba(59, 130, 246, 0.3)',
        borderWidth: 1,
        cornerRadius: 12,
        padding: 16,
        displayColors: false,
        titleFont: { size: 14, weight: '600' },
        bodyFont: { size: 13 },
        filter: function(tooltipItem) {
          return tooltipItem.parsed.y !== 0;
        }
      }
    },
    scales: {
      x: {
        display: true,
        grid: {
          display: false,
          drawBorder: false
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 11, weight: '500' }
        }
      },
      y: {
        display: true,
        grid: {
          color: 'rgba(156, 163, 175, 0.1)',
          drawBorder: false,
          lineWidth: 1
        },
        ticks: {
          color: '#9CA3AF',
          font: { size: 11, weight: '500' }
        }
      }
    },
    interaction: {
      intersect: false,
      mode: 'index'
    },
    animation: {
      duration: 800,
      easing: 'easeOutCubic'
    }
  };

  const formatMonth = (month) => {
    return new Date(month + "-01").toLocaleDateString("en-US", {
      month: "short",
      year: "numeric",
    });
  };

  const createBarChart = (canvas, data, labels, color, gradient, tooltipCallback) => {
    const ctx = canvas.getContext("2d");
    const chartGradient = createGradient(ctx, gradient);
    
    return new Chart(ctx, {
      type: "bar",
      data: {
        labels: labels,
        datasets: [{
          label: "Photos",
          data: data,
          backgroundColor: chartGradient,
          borderColor: color,
          borderWidth: 1,
          borderRadius: 6,
          borderSkipped: false,
        }],
      },
      options: {
        ...defaultChartOptions,
        plugins: {
          ...defaultChartOptions.plugins,
          tooltip: {
            ...defaultChartOptions.plugins.tooltip,
            callbacks: { label: tooltipCallback },
          },
        },
      },
    });
  };

  const createPieChart = (canvas, data, labels, backgroundColor, tooltipCallback) => {
    const ctx = canvas.getContext("2d");
    
    return new Chart(ctx, {
      type: "pie",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          borderColor: "white",
          borderWidth: 3,
          hoverOffset: 12,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: '#4B5563',
              usePointStyle: true,
              padding: 16,
              font: { size: 12, weight: '500' },
            },
          },
          tooltip: {
            ...defaultChartOptions.plugins.tooltip,
            callbacks: { label: tooltipCallback },
          },
        },
      },
    });
  };

  const createDoughnutChart = (canvas, data, labels, backgroundColor, tooltipCallback) => {
    const ctx = canvas.getContext("2d");
    
    return new Chart(ctx, {
      type: "doughnut",
      data: {
        labels: labels,
        datasets: [{
          data: data,
          backgroundColor: backgroundColor,
          borderColor: "white",
          borderWidth: 3,
          hoverOffset: 8,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: "right",
            labels: {
              color: '#4B5563',
              usePointStyle: true,
              padding: 16,
              font: { size: 12, weight: '500' },
            },
          },
          tooltip: {
            ...defaultChartOptions.plugins.tooltip,
            callbacks: { label: tooltipCallback },
          },
        },
      },
    });
  };

  const initializeCharts = () => {
    if (!photoStats) return;

    if (photoStats.photosByYear && photoStats.photosByYear.length > 0) {
      photosByYearChart = createBarChart(
        photosByYearCanvas,
        photoStats.photosByYear.map((d) => d.count),
        photoStats.photosByYear.map((d) => d.year),
        colors.primary,
        ["rgba(59, 130, 246, 0.4)", "rgba(59, 130, 246, 0.1)"],
        (context) => `${context.parsed.y} photos in ${context.label}`
      );
    }

    if (photoStats.photosByMonth && photoStats.photosByMonth.length > 0) {
      const photosByMonthCtx = photosByMonthCanvas.getContext("2d");
      const photosByMonthGradient = createGradient(photosByMonthCtx, [
        "rgba(139, 92, 246, 0.3)",
        "rgba(139, 92, 246, 0.05)",
      ]);

      photosByMonthChart = new Chart(photosByMonthCtx, {
        type: "line",
        data: {
          labels: photoStats.photosByMonth.map((d) => formatMonth(d.month)),
          datasets: [
            {
              label: "Photos",
              data: photoStats.photosByMonth.map((d) => d.count),
              borderColor: colors.secondary,
              backgroundColor: photosByMonthGradient,
              borderWidth: 2.5,
              fill: true,
              tension: 0.3,
              pointBackgroundColor: colors.secondary,
              pointBorderColor: "white",
              pointBorderWidth: 2,
              pointRadius: 4,
              pointHoverRadius: 6,
            },
          ],
        },
        options: {
          ...defaultChartOptions,
          scales: {
            ...defaultChartOptions.scales,
            x: {
              ...defaultChartOptions.scales.x,
              ticks: {
                ...defaultChartOptions.scales.x.ticks,
                maxRotation: 45,
                callback: function (value, index) {
                  return index % 3 === 0 ? this.getLabelForValue(value) : "";
                },
              },
            }
          },
          plugins: {
            ...defaultChartOptions.plugins,
            tooltip: {
              ...defaultChartOptions.plugins.tooltip,
              callbacks: {
                label: (context) => `${context.parsed.y} photos in ${context.label}`,
              },
            },
          },
        },
      });
    }

    if (photoStats.equipment?.cameras && photoStats.equipment.cameras.length > 0) {
      camerasChart = createPieChart(
        camerasCanvas,
        photoStats.equipment.cameras.map((d) => d.count),
        photoStats.equipment.cameras.map((d) => d.name),
        [
          "rgba(59, 130, 246, 0.8)",
          "rgba(139, 92, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(6, 182, 212, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(99, 102, 241, 0.8)",
          "rgba(156, 163, 175, 0.8)",
          "rgba(168, 85, 247, 0.8)",
        ],
        (context) => {
          const total = photoStats.equipment.cameras.reduce((sum, c) => sum + c.count, 0);
          const percentage = ((context.parsed / total) * 100).toFixed(1);
          return `${context.parsed} photos (${percentage}%)`;
        }
      );
    }

    if (photoStats.equipment?.lenses && photoStats.equipment.lenses.length > 0) {
      lensesChart = createBarChart(
        lensesCanvas,
        photoStats.equipment.lenses.map((d) => d.count),
        photoStats.equipment.lenses.map((d) => d.name),
        colors.success,
        ["rgba(16, 185, 129, 0.4)", "rgba(16, 185, 129, 0.1)"],
        (context) => {
          const total = photoStats.equipment.lenses.reduce((sum, l) => sum + l.count, 0);
          const percentage = ((context.parsed.y / total) * 100).toFixed(1);
          return `${context.parsed.y} photos (${percentage}%)`;
        }
      );
    }

    if (photoStats.settings?.iso && photoStats.settings.iso.length > 0) {
      isoChart = createBarChart(
        isoCanvas,
        photoStats.settings.iso.map((d) => d.count),
        photoStats.settings.iso.map((d) => d.name),
        colors.warning,
        ["rgba(245, 158, 11, 0.4)", "rgba(245, 158, 11, 0.1)"],
        (context) => `${context.parsed.y} photos at ISO ${context.label}`
      );
    }

    if (photoStats.settings?.apertures && photoStats.settings.apertures.length > 0) {
      aperturesChart = createDoughnutChart(
        aperturesCanvas,
        photoStats.settings.apertures.map((d) => d.count),
        photoStats.settings.apertures.map((d) => `${d.name}`),
        [
          "rgba(139, 92, 246, 0.8)",
          "rgba(59, 130, 246, 0.8)",
          "rgba(16, 185, 129, 0.8)",
          "rgba(245, 158, 11, 0.8)",
          "rgba(239, 68, 68, 0.8)",
          "rgba(6, 182, 212, 0.8)",
          "rgba(236, 72, 153, 0.8)",
          "rgba(99, 102, 241, 0.8)",
        ],
        (context) => {
          const total = photoStats.settings.apertures.reduce((sum, a) => sum + a.count, 0);
          const percentage = ((context.parsed / total) * 100).toFixed(1);
          return `${context.parsed} photos (${percentage}%)`;
        }
      );
    }

    if (photoStats.settings?.focalLengths && photoStats.settings.focalLengths.length > 0) {
      focalLengthsChart = createBarChart(
        focalLengthsCanvas,
        photoStats.settings.focalLengths.map((d) => d.count),
        photoStats.settings.focalLengths.map((d) => d.name),
        colors.pink,
        ["rgba(236, 72, 153, 0.4)", "rgba(236, 72, 153, 0.1)"],
        (context) => `${context.parsed.y} photos at ${context.label}`
      );
    }
  };

  onMount(() => {
    setTimeout(() => {
      initializeCharts();
    }, 100);
  });

  onDestroy(() => {
    [photosByYearChart, photosByMonthChart, camerasChart, lensesChart, isoChart, aperturesChart, focalLengthsChart]
      .forEach((chart) => chart?.destroy());
  });
</script>

<div class="min-h-screen">
  <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
    {#if photoStats}
      <div class="space-y-12">
        <div
          class="text-center"
          in:fly={{ y: -20, duration: 400, delay: 100, easing: cubicOut }}>
          <h1 class="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
            Photo Statistics
          </h1>
          <p class="text-gray-600 text-lg">Insights from my wildlife photography collection</p>
        </div>

        <div class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {#each [
            { 
              title: "Total Photos", 
              value: photoStats.totalPhotos.toLocaleString(), 
              icon: "📸", 
              color: "blue",
              subtitle: "In collection"
            }, 
            { 
              title: "Years Active", 
              value: photoStats.dateRange.span.toString(), 
              icon: "📅", 
              color: "green",
              subtitle: `Since ${photoStats.dateRange.oldest?.getFullYear() || 'N/A'}`
            }, 
            { 
              title: "With GPS", 
              value: `${photoStats.locations.percentage}%`, 
              icon: "🌍", 
              color: "purple",
              subtitle: `${photoStats.locations.withGPS} photos`
            }, 
            { 
              title: "Locations", 
              value: photoStats.locations.unique.toString(), 
              icon: "📍", 
              color: "orange",
              subtitle: "Unique places"
            }
          ] as stat, i}
            <div
              class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
              in:fly={{
                y: 20,
                duration: 400,
                delay: 200 + i * 50,
                easing: cubicOut,
              }}>
              <div class="flex items-center justify-between mb-4">
                <div class="text-2xl">{stat.icon}</div>
                <div class="text-xs font-medium text-{stat.color}-600 bg-{stat.color}-50 px-2 py-1 rounded-full">
                  {stat.subtitle}
                </div>
              </div>
              <h3 class="text-sm font-medium text-gray-600 mb-1">
                {stat.title}
              </h3>
              <p class="text-2xl font-bold text-gray-900">
                {stat.value}
              </p>
            </div>
          {/each}
        </div>

        <div class="space-y-8">
          <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
            {#if photoStats.photosByYear && photoStats.photosByYear.length > 0}
              <div
                class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                in:fly={{ x: -20, duration: 400, delay: 300, easing: cubicOut }}>
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg font-semibold text-gray-900">Photos by Year</h3>
                  <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    Timeline
                  </span>
                </div>
                <div class="h-64 w-full">
                  <canvas bind:this={photosByYearCanvas}></canvas>
                </div>
              </div>
            {/if}

            {#if photoStats.photosByMonth && photoStats.photosByMonth.length > 0}
              <div
                class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                in:fly={{ x: 20, duration: 400, delay: 350, easing: cubicOut }}>
                <div class="flex items-center justify-between mb-6">
                  <h3 class="text-lg font-semibold text-gray-900">Monthly Activity</h3>
                  <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                    All Time
                  </span>
                </div>
                <div class="h-64 w-full">
                  <canvas bind:this={photosByMonthCanvas}></canvas>
                </div>
              </div>
            {/if}
          </div>
        </div>

        {#if (photoStats.equipment?.cameras && photoStats.equipment.cameras.length > 0) || (photoStats.equipment?.lenses && photoStats.equipment.lenses.length > 0)}
          <div class="space-y-8">
            <div class="text-center">
              <h2 class="text-2xl font-semibold text-gray-900 mb-2">
                Camera Equipment
              </h2>
              <p class="text-gray-600">Breakdown of cameras and lenses used</p>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {#if photoStats.equipment?.cameras && photoStats.equipment.cameras.length > 0}
                <div
                  class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  in:fly={{ x: -20, duration: 400, delay: 400, easing: cubicOut }}>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Camera Bodies</h3>
                    <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      Top {photoStats.equipment.cameras.length}
                    </span>
                  </div>
                  <div class="h-64 w-full">
                    <canvas bind:this={camerasCanvas}></canvas>
                  </div>
                </div>
              {/if}

              {#if photoStats.equipment?.lenses && photoStats.equipment.lenses.length > 0}
                <div
                  class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  in:fly={{ x: 20, duration: 400, delay: 450, easing: cubicOut }}>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Lenses</h3>
                    <span class="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded-md">
                      Top {photoStats.equipment.lenses.length}
                    </span>
                  </div>
                  <div class="h-64 w-full">
                    <canvas bind:this={lensesCanvas}></canvas>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        {#if (photoStats.settings?.iso && photoStats.settings.iso.length > 0) || (photoStats.settings?.apertures && photoStats.settings.apertures.length > 0) || (photoStats.settings?.focalLengths && photoStats.settings.focalLengths.length > 0)}
          <div class="space-y-8">
            <div class="text-center">
              <h2 class="text-2xl font-semibold text-gray-900 mb-2">
                Camera Settings
              </h2>
              <p class="text-gray-600">Most commonly used camera settings</p>
            </div>

            <div class="grid grid-cols-1 gap-6 lg:grid-cols-3">
              {#if photoStats.settings?.iso && photoStats.settings.iso.length > 0}
                <div
                  class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  in:fly={{ y: 20, duration: 400, delay: 500, easing: cubicOut }}>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">ISO Values</h3>
                  </div>
                  <div class="h-64 w-full">
                    <canvas bind:this={isoCanvas}></canvas>
                  </div>
                </div>
              {/if}

              {#if photoStats.settings?.apertures && photoStats.settings.apertures.length > 0}
                <div
                  class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  in:fly={{ y: 20, duration: 400, delay: 550, easing: cubicOut }}>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Apertures</h3>
                  </div>
                  <div class="h-64 w-full">
                    <canvas bind:this={aperturesCanvas}></canvas>
                  </div>
                </div>
              {/if}

              {#if photoStats.settings?.focalLengths && photoStats.settings.focalLengths.length > 0}
                <div
                  class="bg-white rounded-xl border border-gray-200 p-6 shadow-sm hover:shadow-md transition-shadow duration-200"
                  in:fly={{ y: 20, duration: 400, delay: 600, easing: cubicOut }}>
                  <div class="flex items-center justify-between mb-6">
                    <h3 class="text-lg font-semibold text-gray-900">Focal Lengths</h3>
                  </div>
                  <div class="h-64 w-full">
                    <canvas bind:this={focalLengthsCanvas}></canvas>
                  </div>
                </div>
              {/if}
            </div>
          </div>
        {/if}

        <div class="text-center py-8" in:fade={{ duration: 300, delay: 750 }}>
          <p class="text-sm text-gray-500">
            Statistics generated from {photoStats.totalPhotos} photos •
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </div>
      </div>
    {/if}
  </div>
</div>
