Module.register("MMM-TBM", {
  defaults: {
    station_name: "",
    station_ids: [],
    station_distances: [], // [{ id: number, distance: "xxx m" }]
    key_token: "",
    max_per_station: 2,
    station_type: "transport" // or "citybike"
  },

  start() {
    this.instancesData = {}
    this.instancesData[this.identifier] = { templateContent: "Chargement..." }
    this.scheduleUpdate()
  },

  getStyles() {
    return ["template.css"]
  },

  getDom() {
    const wrapper = document.createElement("div")
    const data = this.instancesData[this.identifier] || { templateContent: "Chargement..." }
    wrapper.innerHTML = `<b>${this.config.station_name}</b><br />${data.templateContent}`
    return wrapper
  },

  scheduleUpdate() {
    this.sendRequest()
    setInterval(() => this.sendRequest(), 30 * 1000)
  },

  sendRequest() {
    const notif = this.config.station_type === "citybike" ? "GET_CITYBIKE_DATA" : "GET_TBM_DATA"
    this.sendSocketNotification(notif, {
      identifier: this.identifier,
      station_ids: this.config.station_ids,
      key_token: this.config.key_token,
      max_per_station: this.config.max_per_station,
      distances: this.config.station_distances
    })
  },

  socketNotificationReceived(notification, payload) {
    const expectedNotif = `TBM_DATA_${this.identifier}`
    const expectedCityBikeNotif = `CITYBIKE_DATA_${this.identifier}`

    if (notification === expectedNotif && this.config.station_type === "transport") {
      this.instancesData[this.identifier].templateContent = this.formatTBMData(payload.departures, this.config.station_ids)
      this.updateDom()
    } else if (notification === expectedCityBikeNotif && this.config.station_type === "citybike") {
      this.instancesData[this.identifier].templateContent = this.formatCityBikeData(payload.stations)
      this.updateDom()
    }
  },

  formatTBMData(data, station_ids) {
    if (!data.length) return "Aucune donnée disponible."
    let html = ""
    const filtered = data.filter(d => station_ids.includes(d.station_id))
    filtered.forEach((dep) => {
      const isTram = /tram/i.test(dep.line)
      const lineLabel = isTram
        ? dep.line.replace(/tram\s*/i, "").trim()
        : dep.line.match(/\d+/) ? dep.line.match(/\d+/)[0] : dep.line
      const color = this.getLineColor(lineLabel, isTram)
      const arrival = this.getTimeDiff(dep.time)
      html += `<div class="departure-line">
      <span class="line-badge ${isTram ? "circle" : "square"}" style="background-color:${color}">${lineLabel}</span>
      <span class="terminus">${dep.terminus}</span>
      <span class="time"><span class="clock-icon">🕒</span>${arrival}</span>
    </div>`
    })
    return html
  },

  formatCityBikeData(stations) {
    if (!stations.length) return "Aucune donnée vélos disponible."
    let html = ""
    stations.forEach((st) => {
      const statusHtml = st.is_under_maintenance
        ? "<span class=\"maintenance-status\">En maintenance</span>"
        : `<div class="bike-info">
             <span class="bike-count"><i class="fas fa-bicycle"></i> ${st.bikes_available} vélos</span>
             <span class="ebike-count"><i class="fas fa-bolt"></i> ${st.ebikes_available} élec.</span>
           </div>
           <div class="dock-info">
             <span class="dock-count"><i class="fas fa-parking"></i> ${st.docks_available} places</span>
           </div>
           <div class="distance-info">
             <span class="distance"><i class="fas fa-map-marker-alt"></i> ${st.distance}</span>
           </div>`
      html += `<div class="bike-station">
          <div class="station-header"><span class="station-name">${st.name}</span></div>
          <div class="station-details">${statusHtml}</div>
        </div>`
    })
    return html
  },

  getTimeDiff(date) {
    const diff = Math.floor((new Date(date).getTime() - Date.now()) / 60000)
    return diff < 1 ? "<span class=\"text-red\">Approche</span>" : `${diff} min`
  },

  getLineColor(line, isTram) {
    const tramColors = { A: "#802280", B: "#e40242", C: "#cf5197", D: "#9262a3" }
    const busColors = {
      G: "#006686",
      1: "#00b1eb",
      2: "#00b1eb",
      5: "#00b1eb",
      6: "#00b1eb",
      7: "#00b1eb",
      8: "#00b1eb",
      9: "#00b1eb",
      15: "#00b1eb",
      16: "#00b1eb",
      20: "#00a98b",
      22: "#00a98b",
      23: "#00a98b",
      24: "#00a98b",
      25: "#00a98b",
      26: "#00a98b",
      27: "#00a98b",
      28: "#00a98b",
      29: "#00a98b",
      30: "#76b82a",
      31: "#00b1eb",
      32: "#76b82a",
      33: "#76b82a",
      34: "#76b82a",
      35: "#00b1eb",
      37: "#76b82a",
      38: "#76b82a",
      39: "#00b1eb",
      51: "#4a4a49",
      52: "#4a4a49",
      53: "#4a4a49",
      54: "#4a4a49",
      55: "#4a4a49",
      57: "#4a4a49",
      60: "#76b82a",
      61: "#76b82a",
      64: "#76b82a",
      65: "#76b82a",
      66: "#76b82a",
      67: "#76b82a",
      69: "#76b82a",
      70: "#76b82a",
      71: "#76b82a",
      72: "#76b82a",
      73: "#76b82a",
      74: "#76b82a",
      75: "#76b82a",
      76: "#76b82a",
      77: "#76b82a",
      78: "#76b82a",
      79: "#76b82a",
      80: "#76b82a",
      81: "#76b82a",
      82: "#76b82a",
      83: "#76b82a",
      84: "#76b82a",
      85: "#76b82a",
      86: "#76b82a",
      87: "#76b82a",
      89: "#76b82a",
      90: "#76b82a"
    }
    return isTram ? (tramColors[line.toUpperCase()] || "#555") : (busColors[line] || "#555")
  }
})
