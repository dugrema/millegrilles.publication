import React, {useState, useEffect} from 'react'
import {Row, Col, Nav, Form, Button} from 'react-bootstrap'

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
                     setCdnId={setCdnId}
                     listeCdns={listeCdns} />
    </>
  )

}

function AfficherListe(props) {

  if(!props.listeCdns) return ''

  return (
    <>
      <h3>Liste des configuration existantes</h3>

      <Nav onSelect={props.setCdnId}>
        {
          props.listeCdns.map(cdn=>{
            return (
              <Row key={cdn.cdn_id}>
                <Col>
                  <Nav.Link eventKey={cdn.cdn_id}>
                    {cdn.description || cdn.cdn_id}
                  </Nav.Link>
                </Col>
                <Col>{cdn.type_cdn}</Col>
              </Row>
            )
          })
        }
      </Nav>
    </>
  )
}

function AfficherCdn(props) {
  const cdn = props.cdn

  const [configuration, setConfiguration] = useState({})

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

  const sauvegarder = async event => {
    const params = await fctPreparerChangement(cdn, configuration)
    await sauvegarderCdn(props.rootProps.chiffrageWorker, props.rootProps.connexionWorker, params, props.majCdn)
    setConfiguration({})  // Reset configuration suite a la mise a jour
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

        <div className="bouton-serie">
          <Button onClick={sauvegarder}>Sauvegarder</Button>
          <Button onClick={props.retour} variant="secondary">Annuler</Button>
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

function preparerParamsChangement(cdn, configuration) {
  console.debug("preparerParamsChangement %O\n", cdn, configuration)

  // Copier configuration
  const configurationMaj = {...configuration}

  // Extraire description, active
  const active = configuration.active?true:false
  delete configurationMaj.description
  delete configurationMaj.active

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
    return {publication}
  }

  return {}
}

async function preparerParamsChangementAwsS3(cdn, configuration) {
  const params = preparerParamsChangement(cdn, configuration)
  if(configuration.secretAccessKey) {
    // Nouveau mot de passe.
    // Chiffrer et generer transaction maitre des cles
    // TODO

    params.maitredescles = {texte: 'Une transaction'}
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
  if(params.maitredescles) {
    params.maitredescles = await chiffrageWorker.formatterMessage(
      params.maitredescles, 'commande.MaitreDesCles.sauvegarderCle', {attacherCertificat: true})
  }

  const reponse = await connexionWorker.majCdn(params)
  console.debug("Reponse maj CDN : %O", reponse)
  majCdn(reponse.cdn)
}
