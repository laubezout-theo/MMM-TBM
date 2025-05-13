const NodeHelper = require("node_helper")
const axios = require("axios")

module.exports = NodeHelper.create({
  async socketNotificationReceived(notification, payload) {
    const { identifier } = payload
    if (notification === "GET_TBM_DATA") {
      await this.handleTransportData(payload, identifier)
    } else if (notification === "GET_CITYBIKE_DATA") {
      await this.handleCityBikeData(payload, identifier)
    }
  },

  async handleTransportData({ station_ids, key_token, max_per_station = 2 }, identifier) {
    const allDepartures = []
    for (const id of station_ids) {
      const datainputs = encodeURIComponent(JSON.stringify({ arret_id: id }))
      const url = `https://data.bordeaux-metropole.fr/geojson/process/saeiv_arret_passages?key=${key_token}&datainputs=${datainputs}`
      try {
        const response = await axios.get(url)
        ;(response.data.features || []).forEach((feature) => {
          const props = feature.properties
          const rawTime = props.hor_estime || props.hor_app || props.hor_theo
          allDepartures.push({
            station_id: id,
            line: props.libelle || "??",
            terminus: props.terminus || "??",
            arrival_time: this.formatTime(rawTime),
            time: new Date(rawTime)
          })
        })
      } catch (err) {
        console.error(`Erreur API TBM (arret ${id}) :`, err.message || err)
      }
    }
    const sorted = allDepartures.sort((a, b) => a.time - b.time)
    const limited = sorted.slice(0, max_per_station * station_ids.length)
    this.sendSocketNotification("TBM_DATA", { identifier, station_ids, departures: limited }) // Envoi des données à l'instance correspondante
  },

  async handleCityBikeData({ station_ids, key_token, distances }, identifier) {
    try {
      const apiUrl = `https://data.bordeaux-metropole.fr/geojson?key=${key_token}&typename=ci_vcub_p`
      const response = await axios.get(apiUrl)
      const features = response.data.features || []

      const stations = station_ids.map((id) => {
        const feat = features.find(f => f.properties.gid === id)
        const distObj = (distances || []).find(d => d.id === id)
        return {
          id,
          name: feat ? feat.properties.nom : `Station ${id}`,
          bikes_available: feat ? feat.properties.nbclassiq : 0,
          ebikes_available: feat ? feat.properties.nbelec : 0,
          docks_available: feat ? feat.properties.nbplaces : 0,
          is_under_maintenance: feat ? feat.properties.etat === "MAINTENANCE" : true,
          distance: distObj ? distObj.distance : ""
        }
      })

      this.sendSocketNotification("CITYBIKE_DATA", { identifier, station_ids, stations }) // Envoi des données à l'instance correspondante
    } catch (err) {
      console.error("Erreur API vélos ville :", err.message || err)
    }
  },

  formatTime(isoString) {
    try {
      const date = new Date(isoString)
      return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
    } catch {
      return "??:??"
    }
  }
})
