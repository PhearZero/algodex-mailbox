/*
 * Copyright Algodex VASP (BVI) Corp., 2022
 * All Rights Reserved.
 */

import React, { useCallback, useEffect, useState } from 'react'
import { serverSideTranslations } from 'next-i18next/serverSideTranslations'
import Head from 'next/head'

// MUI Components
import Typography from '@mui/material/Typography'
import Button from '@mui/material/Button'
import Grid from '@mui/material/Grid'
import Box from '@mui/material/Box'
import Tooltip from '@mui/material/Tooltip'
import ContentCopyIcon from '@mui/icons-material/ContentCopy'
import List from '@mui/material/List'
import ListItem from '@mui/material/ListItem'
import ListItemText from '@mui/material/ListItemText'

// Custom Components
import * as SendAssetsHelper from '@/lib/send_assets.js'
import SendAssetForm from '@/components/SendAssetForm'
import Link from '@/components/Nav/Link'
import useMyAlgo from '@/hooks/use-my-algo'
import { defaults } from 'next-i18next.config'
import { useTranslation } from 'next-i18next'
import Helper from '@/lib/helper'

/**
 * Generate Static Properties
 * @param locale
 */
export async function getServerSideProps({ locale }) {
  return {
    props: {
      ...(await serverSideTranslations(locale, [...defaults])),
    },
  }
}

/**
 * Send Asset Page
 * @returns {JSX.Element}
 * @constructor
 */
export function SendAssetPage() {
  const [loading, setLoading] = useState(false)
  const [assetId, setAssetId] = useState()
  const [wallet, setWallet] = useState()
  const [csvTransactions, setCsvTransactions] = useState()
  const [assetBalance, setAssetBalance] = useState({
    success: false,
    message: '',
  })
  const [actionStatus, setActionStatus] = useState({
    message: '',
    success: false,
  })
  const { t } = useTranslation('common')
  const [formattedAddresses, setFormattedAddresses] = useState([])
  const [gettingBalance, setGettingBalance] = useState(false)
  const [shareableLink, setShareableLink] = useState('')
  const [tooltiptext, setTooltiptext] = useState('Click to Copy')
  const [fileName, setFileName] = useState()
  const [duplicateList, setDuplicateList] = useState([])
  let webURL = ''
  if (typeof window !== 'undefined') {
    webURL = `${window.location.protocol}//${window.location.host}`
  }

  useEffect(() => {
    setFormattedAddresses(
      JSON.parse(localStorage.getItem('algodex_user_wallet_addresses')) || []
    )
  }, [])
  const updateAddresses = useCallback(
    (addresses) => {
      if (addresses == null) {
        return
      }
      // console.debug({ addresses })
      localStorage.setItem(
        'algodex_user_wallet_addresses',
        JSON.stringify(addresses)
      )
      setFormattedAddresses(addresses)
    },
    [setFormattedAddresses]
  )

  const { connect } = useMyAlgo(updateAddresses)

  const updateStatusMessage = (message, status) => {
    setActionStatus({
      message: message || '',
      success: status || false,
    })
  }

  const submitForm = async ({ formData }) => {
    console.debug(formData)

    // console.debug('not blocked')
    setLoading(true)
    updateStatusMessage()
    const responseData = await SendAssetsHelper.send(
      assetId,
      wallet,
      csvTransactions
    )
    // console.debug('responseData', responseData)
    setLoading(false)
    if (responseData?.error == false) {
      if (responseData.confirmedTransactions.accepted == false) {
        updateStatusMessage(
          'Please, ensure you enter a valid wallet address with the asset id provided',
          false
        )
      } else {
        const totalAssets = responseData.confirmedTransactions.length
        const sentAssets = responseData.confirmedTransactions.filter(
          (asset) => asset.value.status == 'confirmed'
        ).length
        updateStatusMessage(
          `${sentAssets}/${totalAssets} transaction(s) sent successfully`,
          true
        )
        setShareableLink(
          `${webURL}/redeem-assets/?senderAddress=${wallet}&assetId=${assetId}`
        )
        getAssetBalance()
      }
    } else {
      if (
        /PopupOpenError|blocked|Can not open popup window|/.test(responseData)
      ) {
        updateStatusMessage(
          'Please disable your popup blocker (likely in the top-right of your browser window)',
          false
        )
        return
      }
      updateStatusMessage(
        responseData.body?.message || 'Sorry, an error occurred',
        false
      )
    }
  }

  useEffect(() => {
    if (!gettingBalance) {
      getAssetBalance()
    }
  }, [assetId, csvTransactions, wallet, gettingBalance])

  useEffect(() => {
    if (actionStatus.message != '') {
      updateStatusMessage()
    }
  }, [assetId, csvTransactions, wallet])

  const getAssetBalance = async () => {
    if (wallet && assetId) {
      setGettingBalance(true)
      const responseData = await Helper.getFormattedAssetBalance(
        wallet,
        parseInt(assetId),
        true
      )
      setTimeout(() => {
        setGettingBalance(false)
      }, 2000)
      // console.debug('responseData', responseData)
      if (responseData && responseData.error == false) {
        setAssetBalance({ success: true, message: responseData.balance })
      } else {
        setAssetBalance({
          success: false,
          message:
            responseData?.data?.message ||
            // eslint-disable-next-line max-len
            'An error occurred while getting your asset balance, please ensure you enter a valid asset id',
        })
      }
    }
  }

  const copyLink = () => {
    document.querySelector('.copyToClipboard')
    navigator.clipboard.writeText(shareableLink)
    setTooltiptext(`Copied: ${shareableLink}`)
    setTimeout(() => {
      setTooltiptext('Click to Copy')
    }, 500)
  }

  const getFileUpload = async (e) => {
    const csvFiles = e.target.files[0]
    if(csvFiles){
      updateStatusMessage()
      setDuplicateList([])
      setFileName(csvFiles.name)
      const reader = new FileReader()
      reader.onloadend = ({ target }) => {
        const text = target.result
        checkForDuplicate(text)
      }
      reader.readAsText(csvFiles)
    }
  }

  const checkForDuplicate = (csv) => {
    const rows = csv.slice(csv.indexOf('\n') + 1).split('\n')
    // console.debug({ rows })
    const count = {}
    if (rows[0] == '') {
      setActionStatus({
        message: 'Oops, empty CSV file',
        success: false,
      })
    } else {
      rows.forEach((v) => {
        if (v) {
          const value = v.split(',')[0]
          count[value] = count[value] + 1 || 1
        }
      })
      const duplicate = []
      Object.entries(count).forEach((c) => {
        if (c[1] > 1) {
          duplicate.push(c[0])
        }
      })
      if (duplicate.length > 0) {
        setCsvTransactions()
        setDuplicateList(duplicate)
        setActionStatus({
          message:
            // eslint-disable-next-line max-len
            'Same wallet address on multiple rows of your CSV file is not allowed. This causes race conditions and we can\'t support it',
          success: false,
        })
      } else {
        setCsvTransactions(csv.replace(/\r?\r/g, ''))
      }
    }
  }

  return (
    <>
      <Head>
        <title>{`${t('/send-assets')} | ${t('app-title')}`}</title>
      </Head>
      <Grid container spacing={2}>
        <Grid item xs={12} md={8} lg={6} xl={5}>
          <Typography variant="h5" sx={{ marginBottom: '1rem' }}>
            {t('/send-assets')}
          </Typography>
          <Button variant="contained" onClick={connect}>
            {t('connect-wallet')}
          </Button>
          {assetBalance.message != '' && (
            <Typography
              variant="error-message"
              display="block"
              marginTop="1rem"
              color={assetBalance.success ? 'green' : 'error'}
            >
              {assetBalance.message} {assetBalance.success ? 'available' : ''}
            </Typography>
          )}
          <SendAssetForm
            formattedAddresses={formattedAddresses}
            onSubmit={submitForm}
            actionStatus={actionStatus}
            isLoading={loading}
            setWallet={setWallet}
            setAssetId={setAssetId}
            csvTransactions={csvTransactions}
            getFileUpload={getFileUpload}
            fileName={fileName}
            assetId={assetId}
            wallet={wallet}
          />
          {duplicateList.length > 0 && (
            <>
              <Typography
                variant="error-message"
                display="block"
                marginTop="1rem"
                marginBottom='0'
                color={'error'}
              >
                Find below the duplicate wallet address
                {duplicateList.length > 1 && 'es'}
              </Typography>
              <List dense={false}>
                {duplicateList.map((d) => (
                  <ListItem key={d} sx={{paddingBlock:'0'}}>
                    <ListItemText primary={d} sx={{ color: 'red', marginBlock:'0' }} />
                  </ListItem>
                ))}
              </List>
            </>
          )}
          {actionStatus.success == true && (
            <Box
              variant="error-message"
              marginTop="3rem"
              sx={{ display: 'flex', alignItems: 'center' }}
            >
              <Link href={shareableLink} target="_blanc" sx={{ color: 'blue' }}>
                Copy and share this link to redeem asset(s)
              </Link>
              <Tooltip
                title={tooltiptext}
                placement="top"
                arrow
                sx={{
                  cursor: 'pointer',
                  marginLeft: '0.5rem',
                }}
              >
                <ContentCopyIcon
                  onClick={copyLink}
                  className="copyToClipboard"
                  fontSize="0.9rem"
                />
              </Tooltip>
            </Box>
          )}
          <Grid container spacing={2} sx={{ marginBlock: '2rem' }}>
            <Grid item xs={6} lg={5} className="mr-2">
              <Link
                href="https://about.algodex.com/docs/algodex-mailbox-user-guide/"
                target="blanc"
                color="primary.dark"
              >
                {t('view-instructions-link')}
              </Link>
            </Grid>
            <Grid item xs={6} lg={5}>
              <Link href={'/sample.csv'} download color="primary.dark">
                {t('download-csv-example-link')}
              </Link>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </>
  )
}

export default SendAssetPage
