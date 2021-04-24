import React, {useState, useEffect} from 'react'
import {Nav} from 'react-bootstrap'

export default function CDNConfig(props) {

  const [listeSites, setListeSites] = useState('')
  useEffect(_=>{
    chargerCdns(props.rootProps.connexionWorker, setListeSites)
  }, [])

  return (
    <>
      <h2>Content delivery networks</h2>
      <Nav.Link onClick={props.retour}>Retour</Nav.Link>
    </>
  )

}

async function chargerCdns(connexionWorker, setListeSites) {
  const cdns = await connexionWorker.requeteListeCdns()
  console.debug("Liste cdns : %O", cdns)
}
