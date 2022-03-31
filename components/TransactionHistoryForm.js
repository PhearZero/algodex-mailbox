/* 
 * Copyright Algodex VASP (BVI) Corp., 2022
 * All Rights Reserved.
 */

import React from 'react'
import { MuiForm5 as Form } from '@rjsf/material-ui'
import PropTypes from 'prop-types'
import LoadingButton from '@mui/lab/LoadingButton'
import TextareaAutosize from '@mui/material/TextareaAutosize'
import Grid from '@mui/material/Grid'
import Typography from '@mui/material/Typography'
import Link from '@/components/Nav/Link'

const TransactionHistoryForm = ({
  onSubmit,
  isLoading,
  formData,
  actionStatus,
  csvLink,
}) => {
  const schema = {
    required: ['assetId', 'senderAddress'],
    properties: {
      assetId: { type: 'string', title: 'Asset Id', default: '' },
      senderAddress: { type: 'string', title: 'Sender Address', default: '' },
      csvTransactions: {
        type: 'string',
        title: 'CSV Transactions',
        readOnly: true,
      },
    },
  }

  const customTextArea = (props) => {
    return (
      <TextareaAutosize
        minRows={9}
        maxRows={14}
        // eslint-disable-next-line max-len
        placeholder="Enter your assetId and sender's address above, your CSV transactions will be listed here"
        readOnly
        value={props.value}
        required={props.required}
        style={{ padding: '0.9rem' }}
        onChange={(event) => props.onChange(event.target.value)}
      />
    )
  }

  const widgets = {
    customTextArea: customTextArea,
  }

  const uiSchema = {
    csvTransactions: {
      'ui:widget': customTextArea,
    },
  }

  return (
    <Form
      schema={schema}
      uiSchema={uiSchema}
      onSubmit={onSubmit}
      widgets={widgets}
      onChange={({ formData }) => {
        onSubmit({ formData })
      }}
      formData={{
        assetId: formData.assetId,
        senderAddress: formData.senderAddress,
        csvTransactions: formData.csvTransactions,
      }}
    >
      {csvLink && (
        <Link
          href={csvLink}
          target="_blanc"
          download="Transaction History.csv"
          sx={{ color: 'blue', textDecoration:'underline' }}
        >
          Click to download Transaction History
        </Link>
      )}
      <Grid container spacing={2} marginTop={'2rem'}>
        <Grid item xs={6} lg={4}>
          <LoadingButton loading={isLoading} variant="contained" type="submit">
            Refresh
          </LoadingButton>
        </Grid>
        <Grid item xs={6}>
          {actionStatus.message != '' && (
            <Typography
              variant="error-message"
              sx={{ display: 'flex', justifyContent: 'end' }}
              color={actionStatus.success ? 'green' : 'error'}
            >
              {actionStatus.message}
            </Typography>
          )}
        </Grid>
      </Grid>
    </Form>
  )
}

TransactionHistoryForm.propTypes = {
  onSubmit: PropTypes.func,
  actionStatus: PropTypes.object,
  isLoading:PropTypes.bool,
  formData: PropTypes.object,
  csvLink: PropTypes.string,
}
export default TransactionHistoryForm