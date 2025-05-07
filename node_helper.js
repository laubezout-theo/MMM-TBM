const NodeHelper = require("node_helper")
const axios = require("axios")

module.exports = NodeHelper.create({
  async socketNotificationReceived(notification, payload) {
    if (notification === "GET_TBM_DATA") {
      const { station_ids, key_token, max_per_station = 2 } = payload
      const allDepartures = []

      // Récupérer les départs pour chaque station distinctement
      for (const id of station_ids) {
        const datainputs = encodeURIComponent(JSON.stringify({ arret_id: id }))
        const url = `https://data.bordeaux-metropole.fr/geojson/process/saeiv_arret_passages?key=${key_token}&datainputs=${datainputs}`

        try {
          const response = await axios.get(url)
          const json = response.data

          if (json && Array.isArray(json.features)) {
            const stationDepartures = json.features.map((feature) => {
              const props = feature.properties
              const line = props.libelle || "??"
              const terminus = props.terminus || "??"
              const rawTime = props.hor_estime || props.hor_app || props.hor_theo
              const arrivalTime = this.formatTime(rawTime)

              return {
                station_id: id,
                line,
                terminus,
                arrival_time: arrivalTime,
                time: new Date(rawTime) // Pour trier par heure
              }
            })
            allDepartures.push(...stationDepartures)
          }
        } catch (err) {
          console.error(`Erreur API TBM (arret ${id}) :`, err.message || err)
        }
      }

      // Trier tous les départs par heure (croissant)
      const sortedDepartures = allDepartures.sort((a, b) => a.time - b.time)

      // Limiter le nombre de départs par station
      const limitedDepartures = sortedDepartures.slice(0, max_per_station * station_ids.length)

      // Retourner les départs triés
      this.sendSocketNotification("TBM_DATA", {
        station_ids,
        departures: limitedDepartures
      })
    }
  },

  formatTime(isoString) {
    try {
      const date = new Date(isoString)
      const hours = String(date.getHours()).padStart(2, "0")
      const minutes = String(date.getMinutes()).padStart(2, "0")
      return `${hours}:${minutes}`
    } catch {
      return "??:??"
    }
  }
})
