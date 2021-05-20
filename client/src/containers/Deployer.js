import React, {useState, useEffect} from 'react'
import {Alert, Nav, Row, Col, Button} from 'react-bootstrap'

export default function Deployer(props) {
  return (
    <>
      <p>Deployer</p>
      <Button onClick={props.retour}>Retour</Button>
    </>
  )
}
