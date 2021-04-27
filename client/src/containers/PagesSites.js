import React, {useState, useEffect} from 'react'
import {Row, Col, Nav, Button} from 'react-bootstrap'

export default function PagesSites(props) {

  const [listeSites, setListeSites] = useState('')
  const [site, setSite] = useState('')
  useEffect(_=>{
    const connexionWorker = props.rootProps.connexionWorker
    chargerListeSites(connexionWorker, setListeSites)
  }, [])
  const setSiteId = siteId => {
    siteId = siteId.currentTarget?siteId.currentTarget.value:siteId
    if(siteId) {
      const siteSelect = listeSites.filter(site=>site.site_id===siteId)[0]
      setSite(siteSelect)
    } else {
      setSite('')
    }
  }

  if(site) {
    return <Site site={site}
                 setSiteId={setSiteId}
                 retour={setSiteId} />
  }

  if(!listeSites) {
    return <p>Chargement des sites en cours ...</p>
  }

  return (
    <>
      <h2>Modifier les pages d'un site</h2>
      <Nav onSelect={setSiteId} className="flex-column">
        {
          listeSites.map(site=>(
            <Nav.Link key={site.site_id} eventKey={site.site_id}>{site.nom_site}</Nav.Link>
          ))
        }
        <Nav.Link onClick={props.retour}>Retour</Nav.Link>
      </Nav>
    </>
  )
}

function Site(props) {
  return (
    <>
      <h2>Modifier pages de {props.site.nom_site}</h2>

      <p>Choisir une section a modifier.</p>

      <Button onClick={props.retour}>Retour</Button>
    </>
  )
}

async function chargerListeSites(connexionWorker, setListeSites) {
  const sites = await connexionWorker.requeteSites({})
  console.debug("Sites charges : %O", sites)
  setListeSites(sites)
}
