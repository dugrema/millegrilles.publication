import React, {useState, useEffect} from 'react'
import {Row, Col, Nav, Form} from 'react-bootstrap'

export default function CDNConfig(props) {

  // Liste CDNs
  const [listeCdns, setListeCdns] = useState('')
  useEffect(_=>{
    chargerCdns(props.rootProps.connexionWorker, setListeCdns)
  }, [])

  // Configuration CDN
  const [cdnId, setCdnId] = useState('')

  if(cdnId) {
    console.debug("CDN Id choisi : %O", cdnId)
    const cdn = listeCdns.filter(item=>item.cdn_id===cdnId)[0]
    return <AfficherCdn rootProps={props.rootProps} cdn={cdn} retour={_=>setCdnId('')} />
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

  var TypeCdn = null
  switch(cdn.type_cdn) {
    case 'ipfs':
      TypeCdn = AfficherCdnIpfs; break
    case 'awss3':
      TypeCdn = AfficherCdnAwsS3; break
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
    console.debug("Nombre %s=%s", name, value)
    if(!isNaN(value) && value!=='') {
      value = Number(value)
    } else {
      console.debug("Nombre value vide")
      value = ''
    }
    setConfiguration({...configuration, [name]: value})
  }

  const afficherChamp = nomChamp => {
    return configuration[nomChamp] || (configuration[nomChamp]===''?'':cdn[nomChamp]) || ''
  }

  return (
    <>
      <Nav.Link onClick={props.retour}>Retour</Nav.Link>
      <p>CDN Id {cdn.cdn_id}</p>
      <p>Type : {cdn.type_cdn}</p>
      <Form>
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
  return (
    <p>AWS S3!</p>
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
