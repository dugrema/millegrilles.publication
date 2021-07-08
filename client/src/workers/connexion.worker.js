import {expose as comlinkExpose} from 'comlink'

import connexionClient from '@dugrema/millegrilles.common/lib/connexionClient'

const URL_SOCKET = '/publication/socket.io'

function connecter(opts) {
  opts = opts || {}
  var url = opts.url
  if(!url) {
    // Utiliser le serveur local mais remplacer le pathname par URL_SOCKET
    const urlLocal = new URL(opts.location)
    urlLocal.pathname = URL_SOCKET
    urlLocal.hash = ''
    urlLocal.search = ''
    url = urlLocal.href
  }
  console.debug("Connecter socket.io sur url %s", url)
  return connexionClient.connecter(url, opts)
}

function requeteMapping(params) {
  return connexionClient.emitBlocking('publication/requeteMapping', params, {noformat: true})
}

function requeteSites(params) {
  return connexionClient.emitBlocking('publication/requeteSites', params, {noformat: true})
}

function requeteSite(siteId) {
  return connexionClient.emitBlocking('publication/requeteSite', {site_id: siteId}, {noformat: true})
}

function requeteSectionsSite(siteId) {
  return connexionClient.emitBlocking('publication/requeteSectionsSite', {site_id: siteId}, {noformat: true})
}

function requeteSection(sectionId) {
  return connexionClient.emitBlocking('publication/requeteSection', {section_id: sectionId}, {noformat: true})
}

function requetePosts(post_ids) {
  return connexionClient.emitBlocking('publication/requetePosts', {post_ids}, {noformat: true})
}

function requeteNoeudsPublics() {
  return connexionClient.emitBlocking('publication/requeteNoeuds', {}, {noformat: true})
}

function requeteCollections(params) {
  return connexionClient.emitBlocking('publication/requeteCollectionsPubliques', params, {noformat: true})
}

function requeteListeCdns() {
  return connexionClient.emitBlocking('publication/requeteListeCdns', {}, {noformat: true})
}

function requeteCleSsh() {
  return connexionClient.emitBlocking('publication/requeteCleSsh', {}, {noformat: true})
}

function requeteForums() {
  return connexionClient.emitBlocking('publication/requeteForums', {}, {noformat: true})
}

function requetePartiesPage(sectionId) {
  return connexionClient.emitBlocking('publication/requetePartiesPage', {section_id: sectionId}, {noformat: true})
}

function getCollections() {
  const domaineAction = 'GrosFichiers.collections'
  return connexionClient.emitBlocking('grosfichiers/getCollections', {}, {domaine: domaineAction, attacherCertificat: true})
}

function getContenuCollection(uuid_collection) {
  const domaineAction = 'GrosFichiers.contenuCollection'
  return connexionClient.emitBlocking('grosfichiers/getContenuCollection', {uuid: uuid_collection}, {domaine: domaineAction, attacherCertificat: true})
}

function getCleFichier(listeFuuid, opts) {
  opts = opts || {}
  const domaineAction = 'MaitreDesCles.dechiffrage'
  const requete = { liste_hachage_bytes: listeFuuid, permission: opts.permission }
  return connexionClient.emitBlocking('maitrecles/getCleFichier', requete, {domaine: domaineAction, attacherCertificat: true})
}

function getEtatPublication() {
  return connexionClient.emitBlocking('publication/etatPublication', null, {noformat: true})
}

function getEtatSite(site_id) {
  return connexionClient.emitBlocking('publication/etatSite', {site_id}, {noformat: true})
}

// Commandes

function creerSite(transaction) {
  return connexionClient.emitBlocking('publication/creerSite', transaction, {domaine: 'Publication.creerSite'})
}

function majSite(transaction) {
  return connexionClient.emitBlocking('publication/majSite', transaction, {domaine: 'Publication.majSite'})
}

function majSection(transaction) {
  return connexionClient.emitBlocking('publication/majSection', transaction, {domaine: 'Publication.majSection'})
}

function ajouterPartiePage(siteId, sectionId, typePartie) {
  const transaction = {
    site_id: siteId,
    section_id: sectionId,
    type_partie: typePartie,
  }
  return connexionClient.emitBlocking(
    'publication/majPartiePage', transaction, {domaine: 'Publication.majPartiePage'})
}

function majPartiePage(partiePageId, configuration) {
  const transaction = {
    ...configuration,
    partiepage_id: partiePageId,
  }
  return connexionClient.emitBlocking(
    'publication/majPartiePage', transaction, {domaine: 'Publication.majPartiePage'})
}

function majCdn(params) {
  return connexionClient.emitBlocking('publication/majCdn', params)
}

function supprimerCdn(transaction) {
  return connexionClient.emitBlocking('publication/supprimerCdn', transaction, {domaine: 'Publication.supprimerCdn'})
}

function publierChangements(siteId) {
  return connexionClient.emitBlocking(
    'publication/publierChangements',
    {site_id: siteId?siteId:null},
    {domaine: 'Publication.publierComplet', attacherCertificat: true}
  )
}

function resetData(siteId) {
  return connexionClient.emitBlocking(
    'publication/resetData',
    {
      site_id: siteId?siteId:null,
      ignorer: ['fichier', 'webapps'],
    },
    {domaine: 'Publication.resetRessources', attacherCertificat: true}
  )
}

function resetFichiers(cdnId) {
  return connexionClient.emitBlocking(
    'publication/resetFichiers',
    {
      // site_id: siteId?siteId:null,
      cdn_id: cdnId?cdnId:null,
      inclure: ['fichier', 'collection_fichiers']
    },
    {domaine: 'Publication.resetRessources', attacherCertificat: true}
  )
}

function resetWebapps(cdnId) {
  return connexionClient.emitBlocking(
    'publication/resetWebapps',
    {
      // site_id: siteId?siteId:null,
      cdn_id: cdnId?cdnId:null,
      inclure: ['webapps']
    },
    {domaine: 'Publication.resetRessources', attacherCertificat: true}
  )
}

function setSiteDefaut(params) {
  return connexionClient.emitBlocking('publication/setSiteDefaut', params, {domaine: 'Publication.setSiteDefaut'})
}

function creerForum(params) {
  return connexionClient.emitBlocking('publication/creerForum', params, {domaine: 'Forum.creerForum'})
}

function modifierForum(params) {
  return connexionClient.emitBlocking('publication/modifierForum', params, {domaine: 'Forum.modifierForum'})
}

comlinkExpose({
  ...connexionClient,
  connecter,  // Override de connexionClient.connecter

  requeteMapping, requeteSites, requeteSite, requetePosts, requeteNoeudsPublics,
  requeteCollections, requeteListeCdns, requeteCleSsh,
  requeteForums, requeteSectionsSite, requeteSection, requetePartiesPage,

  getCollections, getContenuCollection, getCleFichier, getEtatPublication,
  getEtatSite,

  creerSite, majSite, majSection, majCdn, supprimerCdn,
  ajouterPartiePage, majPartiePage, setSiteDefaut,

  publierChangements, resetData, resetFichiers, resetWebapps,
  creerForum, modifierForum,
})
