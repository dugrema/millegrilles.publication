import React, {useState, useEffect} from 'react'
import {Row, Col, Button, Card} from 'react-bootstrap'
// import {Link, useParams} from 'react-router-dom'
import { proxy as comlinkProxy } from 'comlink'
import path from 'path'
import {getCleContenu, saveCleContenu} from '@dugrema/millegrilles.common/lib/browser/dbUsager'

import {Constantes} from './Constantes'

export function ListeFichiers(props) {
  const uuidCollection = props.uuidCollection

  if( ! props.fichiers || props.hide ) return ''

  var typesFichiers = props.types || ['video', 'image']

  // Extraire les fichiers de type image ou video
  var fichiers = props.fichiers.filter(item=>{
    // console.debug("Fichier : %O", item)

    if(typesFichiers === true) return true  // On ne retire aucun type

    if(item.version_courante) {
      const baseMimetype = item.version_courante.mimetype.split('/')[0]
      return typesFichiers.includes(baseMimetype)
    }
    return false
  })

  if(props.nombreAffiches) {
    fichiers = fichiers.slice(0, props.nombreAffiches)
  }

  var ViewType = CardView
  if(props.showLignes) {
    ViewType = LigneView
  }

  const mapFichiers = fichiers.map((item, idx)=>{

    var selectionne = props.uuidSelectionne === item.uuid
    var className = props.className || ''
    if(selectionne) {
      className += ' selectionne'
    }

    return (
      <ViewType key={item.uuid}
                item={item}
                idx={idx}
                uuidCollection={uuidCollection}
                permission={props.permission}
                estPublique={props.estPublique}
                onClick={props.onClick}
                usePreview={props.usePreview}
                setSelection={props.setSelection}
                selectionne={selectionne}
                rootProps={props.rootProps}
                keepCached={props.keepCached}
                className={className} />
    )
  })

  return (

    <>
      <Row>
        <Col>
        <Button onClick={props.back}
                value=''
                variant="secondary"
                className="d-md-none">Retour</Button>
        </Col>
      </Row>
      <div>
        {mapFichiers}
      </div>
    </>
  )
}

export async function chargerCle(nomUsager, connexionWorker, fuuid, opts) {
  opts = opts || {}

  // Verifier si la cle est dans le cache (IndexedDB)
  const cleSauvegardee = await getCleContenu(nomUsager, fuuid)
  if(cleSauvegardee) {
    // console.debug("Cle sauvegardee localement (IndexedDB) : %O", cleSauvegardee)
    return cleSauvegardee
  }

  // console.debug("Demande cle pour fichier : %s / %O", fuuid, opts)
  const reponseCle = await connexionWorker.getCleFichier([fuuid], opts)
  // console.debug("Reponse demande cle : %O", reponseCle)

  if(reponseCle.acces === '1.permis') {

    // Conserver cle chiffree dans le cache local
    for(let fuuidCle in reponseCle.cles) {
      const cle = reponseCle.cles[fuuidCle]
      // console.debug("AfficherMedia.chargerCle, saveCleContenu : %O", cle)
      saveCleContenu(nomUsager, fuuidCle, cle)
    }

    return reponseCle.cles[fuuid]
  } else {
    console.error("Erreur, acces refuse a la cle de %s", fuuid)
  }
}

export function CardView(props) {
  const item = props.item

  const _chargerCle = fuuid => {
    const {nomUsager, connexionWorker} = props.rootProps
    const opts = {}
    if(props.permission) opts.permission = props.permission
    return chargerCle(nomUsager, connexionWorker, fuuid, opts)
  }

  var fuuid = item.fuuid_v_courante
  var version_courante = item.version_courante
  if((props.usePreview || props.usePoster) && version_courante) {
    fuuid = version_courante.fuuid_preview
  }

  var className = 'fichier-browsing-img selectionnable ' + props.className

  var card = (
    <Card onClick={props.onClick} data-uuid={item.uuid} className={className}>
      <AfficherImage hachage_bytes={fuuid}
                     chiffrageWorker={props.rootProps.chiffrageWorker}
                     chargerCle={_chargerCle}
                     keepCached={props.keepCached}
                     estPublique={props.estPublique} />
    </Card>
  )

  return card
}

export function CardBodyView(props) {
  const item = props.item

  const _chargerCle = fuuid => {
    const {nomUsager, connexionWorker} = props.rootProps
    const opts = {}
    if(props.permission) opts.permission = props.permission
    return chargerCle(nomUsager, connexionWorker, fuuid, opts)
  }

  var fuuid = item.fuuid_v_courante
  var version_courante = item.version_courante
  if((props.usePreview || props.usePoster) && version_courante) {
    fuuid = version_courante.fuuid_preview
  }

  var card = (
    <Card onClick={props.onClick} data-uuid={item.uuid} className={props.className}>
      <AfficherImage hachage_bytes={fuuid}
                     chiffrageWorker={props.rootProps.chiffrageWorker}
                     chargerCle={_chargerCle}
                     keepCached={props.keepCached}
                     estPublique={props.estPublique} />
      <Card.Body>
        {props.children}
      </Card.Body>
    </Card>
  )

  return card
}

class LigneView extends React.Component {

  state = {
  }

  componentWillUnmount() {
    this.nettoyerCache()
  }

  async nettoyerCache() {
    const url = path.join(Constantes.URL_FICHIERS, this.props.item.fuuid_v_courante)
    const cache = await caches.open(Constantes.FICHIERS_DECHIFFRES_CACHE_NAME)
    await cache.delete(url)
  }

  downloadObjectUrl = async event => {
    const chiffrageWorker = this.props.rootProps.chiffrageWorker
    const fuuid = this.props.item.fuuid_v_courante,
          infoFichier = this.props.item.version_courante

    // Downloader et cacher le fichier
    console.debug("Charger cle : %s", fuuid)
    const informationCle = await this.chargerCle(fuuid)
    console.debug("Information cle pour media : %O", informationCle)

    const mimetype = infoFichier.mimetype,
          filename = infoFichier.filename

    const url = path.join(Constantes.URL_FICHIERS, fuuid)
    console.debug("Telecharger media : %s", url)
    try {
      await chiffrageWorker.downloadCacheFichier(
        url,
        this.progresDownload,
        {
          passwordChiffre: informationCle.cle,
          iv: informationCle.iv,
          tag: informationCle.tag,
          format: informationCle.format,
          mimetype,
          filename,
          DEBUG: false,
        }
      )
      console.debug("Media telecharge : %s", url)

      // Demarrer le download
      this.sauvegarder()
    } finally {
      this.nettoyerCache()
    }

  }

  async sauvegarder() {
    const version_courante = this.props.item.version_courante
    const fuuid = version_courante.fuuid,
          nom_fichier = version_courante.nom_fichier

    const cache = await caches.open(Constantes.FICHIERS_DECHIFFRES_CACHE_NAME)
    if(cache) {
      const cacheUrl = path.join(Constantes.URL_FICHIERS, fuuid)
      const reponse = await cache.match(cacheUrl)
      if( ! reponse ) return false

      // Faire un set de contenu url
      const blob = await reponse.blob()
      const objectUrl = URL.createObjectURL(blob)
      try {
        const a = document.createElement('a')
        a.href = objectUrl
        a.download = nom_fichier
        a.click()
        return true
      } finally {
        URL.revokeObjectURL(objectUrl)
      }
    }
    return false
  }

  progresDownload = comlinkProxy((loaded, total, opt) => {
    loaded = Number(loaded)
    total = Number(total)

    var progres = Math.floor(loaded * 100 / total)
    if(progres === 100 || opt.flag === 'Termine') {
      // Termine
      progres = ''
      console.debug("Telechargement termine")
    } else {
      console.debug("Progres download %d% (%d/%d) %O", progres, loaded, total, opt)
    }

    this.setState({progresPct: progres})
  })

  chargerCle = fuuid => {
    const opts = {}
    if(this.props.permission) opts.permission = this.props.permission
    return chargerCle(
      this.props.rootProps.nomUsager, this.props.rootProps.connexionWorker, fuuid, opts)
  }

  render() {
    const item = this.props.item

    var fuuid = item.fuuid_v_courante
    var version_courante = item.version_courante
    if(this.props.usePreview && version_courante && version_courante.fuuid_preview) {
      fuuid = version_courante.fuuid_preview
    }

    const mimetype = item.mimetype.split('/')[0]
    var thumbnail = ''
    var onClick = this.props.onClick,
        buttonLabel = 'Afficher'
    if(['video', 'image'].includes(mimetype)) {
      thumbnail = (
        <AfficherImage hachage_bytes={fuuid}
                       chiffrageWorker={this.props.rootProps.chiffrageWorker}
                       chargerCle={this.chargerCle}
                       keepCached={this.props.keepCached}
                       estPublique={this.props.estPublique} />
      )
    } else {
      if(this.props.estPublique) {
        onClick = downloadPublic
      } else {
        onClick = this.downloadObjectUrl
      }
      buttonLabel = 'Downloader'
    }

    var button = (
      <Button variant="secondary" className='aslink' onClick={onClick} data-uuid={item.uuid} value={fuuid}>
        {buttonLabel}
      </Button>
    )

    return (
      <Row className={this.props.className}>
        <Col xs={6} lg={2}>{thumbnail}</Col>
        <Col xs={6} lg={10}>
          {item.nom_fichier}
          {button}
        </Col>
      </Row>
    )
  }

}

function downloadPublic(event) {
  const fuuid = event.currentTarget.value
  const publicUrl = path.join(Constantes.URL_FICHIERS, 'public', fuuid)
  // Demarrer download
  window.location = publicUrl
}

export class AfficherMedia extends React.Component {

  state = {
    objectUrl: '',
    err: '',
    progresPct: '',
    // hachage_bytes: '',
  }

  hachage_bytes = ''

  componentDidMount() {
    // this.chargerMedia()
  }

  componentWillUnmount() {
    this.nettoyer()
  }

  nettoyer() {
    const hachage_bytes = this.hachage_bytes
    const chiffrageWorker = this.props.chiffrageWorker

    if(this.state.objectUrl) {
      try {
        // console.debug("Nettoyage object URL %s (media)", hachage_bytes)
        URL.revokeObjectURL(this.state.objectUrl)
      } catch(err) {
        console.debug("Erreur revokeObjectURL sur media %s : %O", hachage_bytes, err)
      }
    }
    if(this.state.posterUrl) {
      try {
        // console.debug("Nettoyage poster URL %s (media)", this.props.poster)
        URL.revokeObjectURL(this.state.posterUrl)
      } catch(err) {
        console.debug("Erreur revokeObjectURL sur media %s : %O", this.props.poster, err)
      }
    }
    if( ! this.props.keepCached ) {
      try {
        this.nettoyerCacheMedia()
      } catch(err) {
        console.debug("Erreur nettoyage cache media %s : %O", hachage_bytes, err)
      }
    }

    if( hachage_bytes && chiffrageWorker ) {
      const url = path.join(Constantes.URL_FICHIERS, hachage_bytes)
      try {
        chiffrageWorker.annulerDownload(url).catch(err=>{
          // Ok si download n'existe pas
          // console.warn("Erreur arret download : %O", err)
        })
      } catch(err) {
        console.warn("Erreur arret download : %O", err)
      }
    }

  }

  async creerObjectUrl() {
    const cache = await caches.open(Constantes.FICHIERS_DECHIFFRES_CACHE_NAME)
    if(cache && this.hachage_bytes) {
      return this.downloadObjectUrl('objectUrl', this.hachage_bytes)
    }
    return false
  }

  async creerPoster(hachage_bytes) {
    const cache = await caches.open(Constantes.FICHIERS_DECHIFFRES_CACHE_NAME)
    if(cache) {
      return this.downloadObjectUrl('posterUrl', hachage_bytes)
    }
    return false
  }

  async downloadObjectUrl(nomVariable, hachage_bytes) {
    const cache = await caches.open(Constantes.FICHIERS_DECHIFFRES_CACHE_NAME)
    if(cache) {
      const cacheUrl = path.join(Constantes.URL_FICHIERS, hachage_bytes)
      const reponse = await cache.match(cacheUrl)
      if( ! reponse ) return false

      // Faire un set de contenu url
      const blob = await reponse.blob()
      const objectUrl = URL.createObjectURL(blob)

      // console.debug("Object url %s cree: %O", nomVariable, objectUrl)
      await new Promise(resolve=>{
        this.setState({[nomVariable]: objectUrl, err: ''}, _=>{resolve()})
      })

      return true
    }
    return false
  }

  async chargerMedia() {
    // Hook a appeler dans render() des sous-classes
    if(this.hachage_bytes !== (this.state.hachage_bytes || this.props.hachage_bytes)) {
      // console.debug("chargerMedia preparation changement media : %O", this.props)
      this.hachage_bytes = (this.state.hachage_bytes || this.props.hachage_bytes)

      // this.setState({hachage_bytes: this.props.hachage_bytes})
      this.nettoyer()

      if(this.props.estPublique) {
        var objectUrl = ''
        if(this.hachage_bytes) {
          objectUrl = path.join(Constantes.URL_FICHIERS, 'public', this.hachage_bytes)
        }
        var posterUrl = ''
        if(this.props.poster) {
          posterUrl = path.join(Constantes.URL_FICHIERS, 'public', this.props.poster)
        }
        // console.debug("Fichier public, URL %s, poster : %s", objectUrl, posterUrl)
        this.setState({objectUrl, posterUrl})
        return  // Plus rien a faire
      }

      const posterFuuid = this.props.poster
      if(this.posterFuuid !== posterFuuid) {
        const mimetype = this.props.mimetype || this.props.info.mimetype
        if(!mimetype || !mimetype.startsWith('image/')) {
          this.posterFuuid = posterFuuid
          // Charger poster en premier
          // console.debug("Charger poster %s", posterFuuid)
          await this.downloaderPoster()
          await this.creerPoster(posterFuuid)
          // console.debug("Poster completement charge %s", posterFuuid)
        } else {
          console.debug("Affichage image, on skip poster %s", posterFuuid)
        }

      }

      // console.debug("Debut charger media : %O", this.props)
      if(!await this.creerObjectUrl()) {
        if(this.props.chiffrageWorker && this.props.chargerCle) {
          // console.debug("Downloader %s", this.hachage_bytes)
          if(await this.downloaderMedia()) {
            // Tenter a nouveau d'afficher le media
            await this.creerObjectUrl()
            if( ! this.props.keepCached ) {
              this.nettoyerCacheMedia()
            }
          } else {
            this.setState({err: 404})
          }
          // console.debug("Object url pret pour %s", this.hachage_bytes)
        } else {
          this.setState({err: 404})
        }
      }
    }
  }

  async downloaderMedia() {
    if(!this.hachage_bytes) {
      console.warn("Downloader media : hachage_bytes est vide %O", this.props)
      return false
    }

    // Downloader et cacher le fichier
    // console.debug("Charger cle : %s, props: %O", this.hachage_bytes, this.props)
    // const informationCle = await this.props.chargerCle(this.hachage_bytes)
    // console.debug("Information cle pour media : %O", informationCle)

    const infoFichier = this.state.info || this.props.info || {},
          mimetype = this.props.mimetype || infoFichier.mimetype,
          filename = this.props.filename || infoFichier.filename || 'fichier'

    try {
      await this.cacheFichier(this.hachage_bytes, {mimetype, filename})
    } catch(err) {
      console.warn("Erreur download fichier chiffre : %O", err)
      return false
    }
    return true
  }

  async downloaderPoster() {
    const fuuidPoster = this.props.poster

    if(!fuuidPoster) {
      console.warn("Downloader poster : poster est vide %O", this.props)
      return false
    }

    // Downloader et cacher le fichier
    // console.debug("Charger cle : %s", fuuidPoster)
    // const informationCle = await this.props.chargerCle(fuuidPoster)
    // console.debug("Information cle pour media : %O", informationCle)
    try {
      await this.cacheFichier(fuuidPoster, {mimetype: 'image/jpeg', filename: fuuidPoster + '.jpg'})
    } catch(err) {
      console.warn("Erreur download poster : %O", err)
      return false
    }

    return true
  }

  async cacheFichier(hachage_bytes, infoFichier) {
    const chiffrageWorker = this.props.chiffrageWorker

    // Downloader et cacher le fichier
    // console.debug("Charger cle : %s", hachage_bytes)
    const informationCle = await this.props.chargerCle(hachage_bytes)
    // console.debug("Information cle pour media : %O", informationCle)
    if(!informationCle) return false

    const mimetype = infoFichier.mimetype,
          filename = infoFichier.filename

    const url = path.join(Constantes.URL_FICHIERS, hachage_bytes)
    // console.debug("Telecharger media : %s", url)
    await chiffrageWorker.downloadCacheFichier(
      url,
      this.progresDownload,
      {
        passwordChiffre: informationCle.cle,
        iv: informationCle.iv,
        tag: informationCle.tag,
        format: informationCle.format,
        mimetype,
        filename,
        DEBUG: false,
      }
    )
    return true
    // console.debug("Media telecharge : %s", url)
  }

  async nettoyerCacheMedia() {
    const hachage_bytes = this.hachage_bytes
    const cache = await caches.open(Constantes.FICHIERS_DECHIFFRES_CACHE_NAME)
    // Annuler download au besoin
    if(hachage_bytes) {
      if(cache) {
        const url = path.join(Constantes.URL_FICHIERS, hachage_bytes)
        await cache.delete(url)

        if(this.props.poster) {
          const posterUrl = path.join(Constantes.URL_FICHIERS, this.props.poster)
          await cache.delete(posterUrl)
        }
      }
    }
  }

}

export class AfficherImage extends AfficherMedia {
  render() {
    // Charger image (aucun effet si image deja chargee)
    this.chargerMedia()

    if(this.state.err) return <p>{this.state.err}</p>
    if(!this.state.objectUrl) return <p>Chargement en cours</p>

    var className=this.props.className || "fichier-viewing-img"

    return (
      <Card className={className}>
        <Card.Img variant="bottom" src={this.state.objectUrl} />
      </Card>
    )
  }
}

export class AfficherVideo extends AfficherMedia {

  render() {
    // Charger image (aucun effet si image deja chargee)
    this.chargerMedia()

    if(this.state.err) return <p>{this.state.err}</p>
    if(!this.state.objectUrl) return <p>Chargement en cours</p>

    console.debug("Information video : %O", this.props)

    const infoVideo = this.props.infoVideo
    var mimetype = this.props.mimetype
    if(infoVideo) {
      mimetype = infoVideo.mimetype
    }

    var height = this.props.height || 480,
        width = this.props.width || ''

    return (
      <video width={width} height={height} className={this.props.className} controls autoPlay>
        <source src={this.state.objectUrl} type={mimetype} />
          Your browser does not support the video tag.
      </video>
    )

  }
}
