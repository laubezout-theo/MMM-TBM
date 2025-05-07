Module.register("MMM-TBM", {
  defaults: {
    station_name: "",
    station_ids: [],
    key_token: "",
    max_per_station: 2
  },

  start() {
    this.instanceData = {
      templateContent: "Chargement..."
    }
    this.sendTBMRequest()
    this.scheduleUpdate()
  },

  getStyles() {
    return ["template.css"]
  },

  getDom() {
    const wrapper = document.createElement("div")
    wrapper.innerHTML = `<b>${this.config.station_name}</b><br />${this.instanceData.templateContent}`
    return wrapper
  },

  scheduleUpdate() {
    setInterval(() => {
      this.sendTBMRequest()
    }, 60 * 1000)
  },

  sendTBMRequest() {
    this.sendSocketNotification("GET_TBM_DATA", {
      station_ids: this.config.station_ids,
      key_token: this.config.key_token,
      max_per_station: this.config.max_per_station
    })
  },

  socketNotificationReceived(notification, payload) {
    if (notification === "TBM_DATA" && this.config.station_ids.some(id => payload.station_ids.includes(id))) {
      this.instanceData.templateContent = this.formatTBMData(payload.departures)
      this.updateDom()
    }
  },

  formatTBMData(data) {
    if (!data || data.length === 0) return "Aucune donnée disponible."

    let html = ""

    // Mélanger les départs dans l'ordre croissant de temps
    data.forEach((dep) => {
      const isTram = dep.line.toLowerCase().includes("tram")
      const lineLabel = dep.line.replace(/tram\s*/i, "").trim() // ex: "Tram C" → "C"
      const color = this.getLineColor(lineLabel, isTram)

      const lineHtml = `<span class="line-badge ${isTram ? "circle" : "square"}" style="background-color:${color}">${lineLabel}</span>`
      html += `<div class="departure-line">${lineHtml}<span class="terminus">${dep.terminus}</span><span class="time">${dep.arrival_time}</span></div>`
    })

    return html
  },

  getLineColor(line, isTram) {
    const tramColors = {
      A: "#9C27B0", // Purple
      B: "#E91E63", // Pink
      C: "#F06292", // Light Pink
      D: "#9575CD" // Lavender
    }

    const busColors = {
      1: "#0078B0", // Blue
      4: "#E2001A", // Red
      9: "#008D36", // Green
      5: "#0078B0", // Blue
      6: "#0078B0", // Blue
      7: "#0078B0", // Blue
      8: "#0078B0", // Blue
      15: "#0078B0", // Blue
      16: "#0078B0", // Blue
      20: "#0078B0", // Blue
      22: "#0078B0", // Blue
      23: "#0078B0", // Blue
      24: "#0078B0", // Blue
      25: "#0078B0", // Blue
      26: "#0078B0", // Blue
      27: "#0078B0", // Blue
      28: "#0078B0", // Blue
      29: "#0078B0", // Blue
      30: "#0078B0", // Blue
      31: "#0078B0", // Blue
      32: "#0078B0", // Blue
      33: "#0078B0", // Blue
      34: "#0078B0", // Blue
      35: "#0078B0", // Blue
      37: "#0078B0", // Blue
      38: "#0078B0", // Blue
      39: "#555555", // Gray
      51: "#555555", // Gray
      52: "#555555", // Gray
      53: "#555555", // Gray
      54: "#555555", // Gray
      55: "#555555", // Gray
      57: "#555555", // Gray
      60: "#555555", // Gray
      61: "#8BC34A", // Light Green
      64: "#8BC34A", // Light Green
      65: "#8BC34A", // Light Green
      66: "#8BC34A", // Light Green
      67: "#8BC34A", // Light Green
      69: "#8BC34A", // Light Green
      70: "#8BC34A", // Light Green
      71: "#8BC34A", // Light Green
      72: "#8BC34A", // Light Green
      73: "#8BC34A", // Light Green
      74: "#8BC34A", // Light Green
      75: "#8BC34A", // Light Green
      76: "#8BC34A", // Light Green
      77: "#8BC34A", // Light Green
      78: "#8BC34A", // Light Green
      79: "#8BC34A", // Light Green
      80: "#8BC34A", // Light Green
      81: "#8BC34A", // Light Green
      82: "#8BC34A", // Light Green
      83: "#8BC34A", // Light Green
      84: "#8BC34A", // Light Green
      85: "#8BC34A", // Light Green
      86: "#8BC34A", // Light Green
      87: "#8BC34A", // Light Green
      89: "#8BC34A", // Light Green
      90: "#8BC34A" // Light Green
    }

    if (isTram) {
      return tramColors[line.toUpperCase()] || "#555"
    }

    return busColors[line] || "#555"
  }
})
