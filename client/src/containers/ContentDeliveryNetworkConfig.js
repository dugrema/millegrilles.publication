import React, {useState, useEffect} from 'react'
import {Row, Col, Nav} from 'react-bootstrap'

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
  const description = cdn.description || cdn.cdn_id
  return (
    <>
      <Nav.Link onClick={props.retour}>Retour</Nav.Link>
      <p>CDN {description}</p>
    </>
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
