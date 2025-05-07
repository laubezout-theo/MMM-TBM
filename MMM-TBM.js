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
    }, 30 * 1000)
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

    if (this.config.station_type === "transport") {
      // Cas pour les transports (tram/bus)
      data.forEach((dep) => {
        const isTram = dep.line.toLowerCase().includes("tram")
        let lineLabel

        if (isTram) {
          lineLabel = dep.line.replace(/tram\s*/i, "").trim() // ex: "Tram C" → "C"
        } else {
          if (dep.line.toLowerCase() === "bus express g") {
            lineLabel = "G" // Retourner uniquement "G" pour le bus express G
          } else {
            lineLabel = dep.line.replace(/\D/g, "") // Garder uniquement les chiffres pour les autres bus
          }
        }

        const color = this.getLineColor(lineLabel, isTram)

        // Calcul du temps restant
        const currentTime = new Date().getTime()
        const arrivalTime = new Date(dep.time).getTime()
        const timeDiffMinutes = Math.floor((arrivalTime - currentTime) / 1000 / 60)

        const timeHtml = timeDiffMinutes < 1
          ? "<span class=\"text-red\">Approche</span>"
          : `<span>${timeDiffMinutes} min</span>`

        const lineHtml = `<span class="line-badge ${isTram ? "circle" : "square"}" style="background-color:${color}">${lineLabel}</span>`
        html += `<div class="departure-line">${lineHtml}<span class="terminus">${dep.terminus}</span><span class="time"><span class="clock-icon">🕒</span>${timeHtml}</span></div>`
      })
    } else if (this.config.station_type === "citybike") {
      // Cas pour les vélos de ville
      data.forEach((station) => {
        html += `<div class="bike-station">
                        <span class="station-name">${station.name}</span>
                        <span class="bike-count">Vélos disponibles : ${station.bikes_available}</span>
                        <span class="dock-count">Places libres : ${station.docks_available}</span>
                     </div>`
      })
    }

    return html
  },

  getLineColor(line, isTram) {
    const tramColors = {
      A: "#802280",
      B: "#e40242",
      C: "#cf5197",
      D: "#9262a3"
    }

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

    if (isTram) {
      return tramColors[line.toUpperCase()] || "#555"
    }

    return busColors[line] || "#555"
  }
})
