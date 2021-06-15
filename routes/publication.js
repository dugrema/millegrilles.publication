const debug = require('debug')('millegrilles:publication:route');
const express = require('express')

function initialiser(amqpdao, opts) {
  if(!opts) opts = {}
  const idmg = amqpdao.pki.idmg

  debug("IDMG: %s, AMQPDAO : %s", idmg, amqpdao !== undefined)

  const route = express.Router()
  route.get('/info.json', routeInfo)
  ajouterStaticRoute(route)

  debug("Route /publication de Publication est initialisee")

  // Retourner dictionnaire avec route pour server.js
  return route
}

function ajouterStaticRoute(route) {
  // Route utilisee pour transmettre fichiers react de la messagerie en production
  var folderStatic =
    process.env.MG_PUBLICATION_STATIC_RES ||
    process.env.MG_STATIC_RES ||
    'static/publication'

  route.use(express.static(folderStatic))
  debug("Route %s pour publication initialisee", folderStatic)
}

function routeInfo(req, res, next) {
  debug(req.headers)
  const idmg = req.idmg
  const nomUsager = req.headers['user-name']
  const userId = req.headers['user-id']
  const niveauSecurite = req.headers['user-securite']
  const host = req.headers.host

  const reponse = {idmg, nomUsager, userId, hostname: host, niveauSecurite}
  return res.send(reponse)
}

module.exports = {initialiser}
