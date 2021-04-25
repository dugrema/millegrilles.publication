import React, {useState, useEffect} from 'react'
import {Row, Col, Nav, Form, Button, Alert} from 'react-bootstrap'

export default function CDNConfig(props) {

  // Liste CDNs
  const [listeCdns, setListeCdns] = useState('')
  useEffect(_=>{
    chargerCdns(props.rootProps.connexionWorker, setListeCdns)
  }, [])

  // Configuration CDN
  const [cdnId, setCdnId] = useState('')

  const majCdn = cdnMaj => {
    console.debug("CDNConfig.majCdn : %O", cdnMaj)
    // Met a jour un CDN dans la liste
    const listeMaj = listeCdns.map(cdn=>{
      if(cdn.cdn_id === cdnMaj.cdn_id) return cdnMaj
      return cdn
    })
    console.debug("Liste maj : %O", listeMaj)
    setListeCdns(listeMaj)
  }

  if(cdnId) {
    console.debug("CDN Id choisi : %O", cdnId)
    const cdn = listeCdns.filter(item=>item.cdn_id===cdnId)[0]
    return <AfficherCdn rootProps={props.rootProps}
                        cdn={cdn}
                        majCdn={majCdn}
                        retour={_=>setCdnId('')} />
  }

  return (
    <>
      <h2>Content delivery networks</h2>
      <Nav.Link onClick={props.retour}>Retour</Nav.Link>

      <AfficherListe rootProps={props.rootProps}
                     setCdnId={event=>{setCdnId(event.currentTarget.value)}}
                     listeCdns={listeCdns} />
    </>
  )

}

function AfficherListe(props) {

  if(!props.listeCdns) return ''

  return (
    <>
      <h3>Liste des configuration existantes</h3>

      {
        props.listeCdns.map(cdn=>{return(
          <Row key={cdn.cdn_id}>
            <Col lg={10}>
              <Button variant="link" onClick={props.setCdnId} value={cdn.cdn_id}>
                {cdn.description || cdn.cdn_id}
              </Button>
            </Col>
            <Col lg={1}>
              {cdn.type_cdn}
            </Col>
            <Col lg={1}>
              {cdn.active?'Active':'Inactif'}
            </Col>
          </Row>
        )})
      }

    </>
  )
}

function AfficherCdn(props) {
  const cdn = props.cdn

  const [configuration, setConfiguration] = useState({})
  const [confirmation, setConfirmation] = useState('')
  const [erreur, setErreur] = useState('')

  var TypeCdn = null,
      fctPreparerChangement = preparerParamsChangement
  switch(cdn.type_cdn) {
    case 'ipfs':
      TypeCdn = AfficherCdnIpfs; break
    case 'awss3':
      TypeCdn = AfficherCdnAwsS3;
      fctPreparerChangement = preparerParamsChangementAwsS3  // Chiffrer secretAccessKey
      break
    case 'sftp':
      TypeCdn = AfficherCdnSftp; break
    default:
      TypeCdn = NonSupporte
  }

  const changerChamp = event => {
    const {name, value} = event.currentTarget
    setConfiguration({...configuration, [name]: value})
  }

  const changerNombre = event => {
    var {name, value} = event.currentTarget
    // console.debug("Nombre %s=%s", name, value)
    if(!isNaN(value) && value!=='') {
      value = Number(value)
    } else {
      console.debug("Nombre value vide")
      value = ''
    }
    setConfiguration({...configuration, [name]: value})
  }

  const changerActive = event => {
    const active = configuration.active || (configuration.active===false?false:cdn.active)
    setConfiguration({...configuration, active: !active})
  }

  const afficherChamp = nomChamp => {
    return configuration[nomChamp] || (configuration[nomChamp]===''?'':cdn[nomChamp]) || ''
  }

  const resetAlerts = _ => {
    setErreur('')
    setConfirmation('')
  }

  const sauvegarder = async event => {
    const {chiffrageWorker, connexionWorker} = props.rootProps
    try {
      const params = await fctPreparerChangement(chiffrageWorker, connexionWorker, cdn, configuration)
      if(!params) {
        return setErreur('Aucun changement detecte')
      }
      await sauvegarderCdn(chiffrageWorker, connexionWorker, params, props.majCdn)
      setConfiguration({})  // Reset configuration suite a la mise a jour
      resetAlerts()
      setConfirmation("Sauvegarde avec success")
    } catch(err) {
      resetAlerts()
      setErreur(''+err)
    }
  }

  return (
    <>
      <h2>Configuration Content Delivery</h2>
      <Form>
        <Form.Row>
          <Form.Group as={Col} lg={6} controlId="cdnId">
            <Form.Label>id</Form.Label>
            <div>{cdn.cdn_id}</div>
          </Form.Group>
          <Form.Group as={Col} lg={6} controlId="active">
            <Form.Label>Active</Form.Label>
            <Form.Check type="switch"
                        id="active"
                        name="active"
                        checked={configuration.active || (configuration.active===false?false:cdn.active) || false}
                        onChange={changerActive} />
          </Form.Group>
        </Form.Row>
        <Form.Row>
          <Form.Group as={Col} controlId="description">
            <Form.Label>Description</Form.Label>
            <Form.Control type="text"
                          name="description"
                          value={afficherChamp('description')}
                          onChange={changerChamp} />
          </Form.Group>
        </Form.Row>
        <TypeCdn rootProps={props.rootProps}
                 cdn={cdn}
                 configuration={configuration}
                 changerChamp={changerChamp}
                 changerNombre={changerNombre}
                 afficherChamp={afficherChamp} />

        <Alert variant="success" show={confirmation?true:false} onClose={resetAlerts} dismissible>
          {confirmation}
        </Alert>
        <Alert variant="danger" show={erreur?true:false} onClose={resetAlerts} dismissible>
          {erreur}
        </Alert>

        <div className="bouton-serie">
          <Button onClick={sauvegarder}>Sauvegarder</Button>
          <Button onClick={props.retour} variant="secondary">Fermer</Button>
        </div>
      </Form>
    </>
  )
}

function AfficherCdnIpfs(props) {
  return (
    <p></p>
  )
}

function AfficherCdnAwsS3(props) {
  const {cdn, configuration, changerChamp, changerNombre, afficherChamp} = props

  return (
    <>
      <h3>Configuration AWS S3</h3>
      <Form.Row>
        <Form.Group as={Col} md={6} controlId="credentialsAccessKeyId">
          <Form.Label>Credentials Access Key Id</Form.Label>
          <Form.Control type="text"
                        name="credentialsAccessKeyId"
                        value={afficherChamp('credentialsAccessKeyId')}
                        autoComplete="off"
                        onChange={changerChamp} />
        </Form.Group>
        <Form.Group as={Col} md={6} controlId="secretAccessKey">
          <Form.Label>Credentials Secret Key (mot de passe)</Form.Label>
          <Form.Control type="password"
                        name="secretAccessKey"
                        placeholder="Changer le mot de passe ici, laisser vide sinon"
                        autoComplete="new-password"
                        value={configuration.secretAccessKey || ''}
                        onChange={changerChamp} />
        </Form.Group>
      </Form.Row>

      <Form.Row>
        <Form.Group as={Col} md={6} controlId="bucketName">
          <Form.Label>Nom Bucket</Form.Label>
          <Form.Control type="text"
                        name="bucketName"
                        value={afficherChamp('bucketName')}
                        autoComplete="off"
                        onChange={changerChamp} />
        </Form.Group>
        <Form.Group as={Col} md={6} controlId="bucketRegion">
          <Form.Label>Region Amazon S3 bucket</Form.Label>
          <Form.Control type="text"
                        name="bucketRegion"
                        value={afficherChamp('bucketRegion')}
                        autoComplete="off"
                        onChange={changerChamp} />
        </Form.Group>
      </Form.Row>

      <Form.Row>
        <Form.Group as={Col} controlId="bucketDirfichier">
          <Form.Label>Repertoire remote</Form.Label>
          <Form.Control type="text"
                        name="bucketDirfichier"
                        value={afficherChamp('bucketDirfichier')}
                        autoComplete="off"
                        onChange={changerChamp} />
        </Form.Group>
      </Form.Row>

      <Form.Row>
        <Form.Group as={Col} controlId="accesPointUrl">
          <Form.Label>URL d'acces aux ressources</Form.Label>
          <Form.Control type="url"
                        name="accesPointUrl"
                        value={afficherChamp('accesPointUrl')}
                        autoComplete="off"
                        placeholder="Exemple : https://SITE.cloudfront.net/...path..."
                        onChange={changerChamp} />
        </Form.Group>
      </Form.Row>

    </>
  )
}

function AfficherCdnSftp(props) {
  const {cdn, configuration, changerChamp, changerNombre, afficherChamp} = props

  const [cleSsh, setCleSsh] = useState('')
  useEffect(_=>{
    chargerCleSftp(props.rootProps.connexionWorker, setCleSsh)
  }, [])

  const clePublique = cleSsh?cleSsh.clePublique:''

  return (
    <>
      <h3>Configuration SFTP</h3>
      <Form.Row>
        <Form.Group as={Col} controlId="host">
          <Form.Label>Host</Form.Label>
          <Form.Control type="text"
                        name="host"
                        value={afficherChamp('host')}
                        onChange={changerChamp} />
        </Form.Group>
        <Form.Group as={Col} controlId="port">
          <Form.Label>Port</Form.Label>
          <Form.Control type="number"
                        name="port"
                        value={afficherChamp('port')}
                        min="1" max="65535"
                        onChange={changerNombre} />
        </Form.Group>
        <Form.Group as={Col} controlId="username">
          <Form.Label>Username</Form.Label>
          <Form.Control type="text"
                        name="username"
                        value={afficherChamp('username')}
                        onChange={changerChamp} />
        </Form.Group>
      </Form.Row>
      <Form.Row>
        <Form.Group as={Col} controlId="repertoireRemote">
          <Form.Label>Repertoire remote</Form.Label>
          <Form.Control type="text"
                        name="repertoireRemote"
                        value={afficherChamp('repertoireRemote')}
                        onChange={changerChamp} />
        </Form.Group>
      </Form.Row>

      <Form.Row>
        <Form.Group as={Col} controlId="accesPointUrl">
          <Form.Label>URL d'acces aux ressources</Form.Label>
          <Form.Control type="url"
                        name="accesPointUrl"
                        value={afficherChamp('accesPointUrl')}
                        placeholder="Exemple : https://SITE.monfournisseur.com/...path..."
                        onChange={changerChamp} />
        </Form.Group>
      </Form.Row>

      <h3>Cle publique de connexion SSH</h3>
      <p>
        Installer (copier) la cle suivante dans .ssh/authorized_keys de
        l'usager sur le serveur de destination.
      </p>

      <pre>{clePublique}</pre>
    </>
  )
}

function NonSupporte(props) {
  return (
    <p>Type de CDN non supporte</p>
  )
}

async function chargerCdns(connexionWorker, setListeCdns) {
  const cdns = await connexionWorker.requeteListeCdns()
  console.debug("Liste cdns : %O", cdns)

  cdns.sort((a, b)=>{
    const nomA = a.description || a.cdn_id,
          nomB = b.description || b.cdn_id

    return nomA.localeCompare(nomB)
  })

  setListeCdns(cdns)
}

async function chargerCleSftp(connexionWorker, setCleSsh) {
  const cleSsh = await connexionWorker.requeteCleSsh()
  console.debug("Reponse cle ssh: %O", cleSsh)
  setCleSsh(cleSsh)
}

async function preparerParamsChangement(chiffrageWorker, connexionWorker, cdn, configuration) {
  console.debug("preparerParamsChangement %O\n", cdn, configuration)

  // Copier configuration
  const configurationMaj = {...configuration}
  delete configurationMaj.description
  delete configurationMaj.active

  // Extraire description, active
  var active = configuration.active
  if(active === undefined) {
    active = cdn.active || false
  }

  // Detection de changements
  const publication = {}
  if(cdn.active !== active) publication.active = active
  if(configuration.description) publication.description = configuration.description
  if(Object.keys(configurationMaj).length > 0) {
    publication.configuration = configurationMaj
  }

  // Retourner publication si changements
  console.debug("Changements detectes pour transaction publication : %O", publication)
  if(Object.keys(publication).length > 0) {
    // Toujours ajouter le type de cdn (immuable)
    if(cdn.cdn_id) publication.cdn_id = cdn.cdn_id
    publication.type_cdn = cdn.type_cdn
    publication.active = active
    return {publication}
  }

  return null
}

async function preparerParamsChangementAwsS3(chiffrageWorker, connexionWorker, cdn, configuration) {
  const params = await preparerParamsChangement(chiffrageWorker, connexionWorker, cdn, configuration)
  if(configuration.secretAccessKey) {
    // Nouveau mot de passe.
    // Chiffrer et generer transaction maitre des cles
    // TODO
    const certificatMaitredescles = await connexionWorker.getCertificatsMaitredescles()
    console.debug("Certificat maitredescles", certificatMaitredescles)
    const certPem = certificatMaitredescles.certificat.join('')
    const identificateurs_document = {type: 'cdn', champ: 'awss3.secretAccessKey'}
    const resultatChiffrage = await chiffrageWorker.chiffrerDocument(
      configuration.secretAccessKey, 'Publication', certPem,
      identificateurs_document, {nojson: true}
    )
    console.debug("Resultat chiffrage : %O", resultatChiffrage)
    const {ciphertext, commandeMaitrecles} = resultatChiffrage

    // Remplacer le champ secretAccessKey par secretAccessKey_chiffre
    const configurationPublication = params.publication.configuration
    configurationPublication.secretAccessKey_chiffre = ciphertext
    delete configurationPublication.secretAccessKey

    params.maitredescles = resultatChiffrage.commandeMaitrecles
  }
  return params
}

async function sauvegarderCdn(chiffrageWorker, connexionWorker, params, majCdn) {
  console.debug("Sauvegarder changements : %O", params)

  // Signer les messages
  if(params.publication) {
    params.publication = await chiffrageWorker.formatterMessage(
      params.publication, 'Publication.majCdn', {attacherCertificat: true})
  }
  // if(params.maitredescles) {
  //   params.maitredescles = await chiffrageWorker.formatterMessage(
  //     params.maitredescles, 'commande.MaitreDesCles.sauvegarderCle', {attacherCertificat: true})
  // }

  const reponse = await connexionWorker.majCdn(params)
  console.debug("Reponse maj CDN : %O", reponse)
  majCdn(reponse.cdn)
}
