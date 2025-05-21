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
    const busColors = { /* same as before */ }
    return isTram ? (tramColors[line.toUpperCase()] || "#555") : (busColors[line] || "#555")
  }
})
