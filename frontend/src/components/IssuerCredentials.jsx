import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Button, Card, CardContent, Typography, CircularProgress, Alert, Box, Chip, List, ListItem, ListItemText, Divider } from '@mui/material';
import VerifiedIcon from '@mui/icons-material/Verified';
import ErrorIcon from '@mui/icons-material/Error';
import { formatDate } from '../utils/dateUtils';

const IssuerCredentials = () => {
  const [credentials, setCredentials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [issuingCredential, setIssuingCredential] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [actionId, setActionId] = useState(null);
  const [verificationStatus, setVerificationStatus] = useState(null);

  // Fetch credentials and verification status when component mounts
  useEffect(() => {
    fetchCredentials();
    fetchVerificationStatus();
  }, []);

  const fetchVerificationStatus = async () => {
    try {
      const response = await axios.get('/api/issuer/verification-status');
      setVerificationStatus(response.data.verification.verified);
    } catch (err) {
      console.error('Error fetching verification status:', err);
    }
  };

  const fetchCredentials = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get('/api/issuer/credentials');
      if (response.data.success) {
        setCredentials(response.data.credentials || []);
      }
    } catch (err) {
      setError('Failed to load credentials. Please try again later.');
      console.error('Error fetching credentials:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIssueCredential = async () => {
    setIssuingCredential(true);
    setError(null);
    setSuccessMessage(null);
    setActionId(null);
    
    try {
      console.log('Starting credential issuance process');
      const response = await axios.post('/api/issuer-vc/issue-vc');
      
      if (response.data.success) {
        setSuccessMessage('Credential issuance initiated successfully!');
        setActionId(response.data.actionId);
        
        // Refresh credentials list after a short delay
        setTimeout(() => {
          fetchCredentials();
        }, 2000);
      } else {
        setError(response.data.message || 'Failed to issue credential.');
      }
    } catch (err) {
      console.error('Error issuing VC:', err);
      const errorMessage = err.response?.data?.error || 
                          err.response?.data?.message || 
                          err.message || 
                          'An error occurred while issuing the credential.';
      setError(errorMessage);
    } finally {
      setIssuingCredential(false);
    }
  };

  const checkCredentialStatus = async (actionId) => {
    if (!actionId) return;
    
    try {
      const response = await axios.get(`/api/issuer/credential-status/${actionId}`);
      
      if (response.data.success) {
        setSuccessMessage(`Current status: ${response.data.status}`);
      } else {
        setError('Failed to check credential status.');
      }
    } catch (err) {
      console.error('Error checking credential status:', err);
    }
  };

  return (
    <Card sx={{ width: '100%', mb: 4 }}>
      <CardContent>
        <Typography variant="h5" component="div" gutterBottom>
          Verifiable Credentials
        </Typography>
        
        {verificationStatus === false && (
          <Alert severity="warning" sx={{ mb: 2 }}>
            Your account needs to be verified before you can issue credentials.
            Please complete KYC verification first.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {successMessage && (
          <Alert severity="success" sx={{ mb: 2 }}>
            {successMessage}
          </Alert>
        )}

        {actionId && (
          <Box sx={{ mb: 2, mt: 2 }}>
            <Typography variant="body2" color="text.secondary">
              Action ID: {actionId}
            </Typography>
            <Button 
              size="small"
              onClick={() => checkCredentialStatus(actionId)}
              sx={{ mt: 1 }}
            >
              Check Status
            </Button>
          </Box>
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="body1">
            Issue a new verifiable credential to your wallet
          </Typography>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleIssueCredential}
            disabled={issuingCredential || verificationStatus === false}
            startIcon={issuingCredential ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {issuingCredential ? 'Issuing...' : 'Issue Credential'}
          </Button>
        </Box>
        
        <Divider sx={{ mb: 2 }} />
        
        <Typography variant="h6" gutterBottom>
          Your Credentials
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : credentials.length === 0 ? (
          <Typography variant="body2" color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
            No credentials found. Issue your first credential by clicking the button above.
          </Typography>
        ) : (
          <List>
            {credentials.map((credential) => (
              <ListItem key={credential.id} divider sx={{ flexDirection: 'column', alignItems: 'flex-start' }}>
                <Box sx={{ display: 'flex', width: '100%', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1">
                    {credential.type} Credential
                  </Typography>
                  <Chip 
                    icon={credential.status === 'ACTIVE' ? <VerifiedIcon /> : <ErrorIcon />}
                    label={credential.status}
                    color={credential.status === 'ACTIVE' ? 'success' : 'default'}
                    size="small"
                  />
                </Box>
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mt: 1 }}>
                      <Typography variant="body2" color="text.secondary">
                        ID: {credential.credential_id}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Issued: {formatDate(credential.issued_date)}
                      </Typography>
                      {credential.expiry_date && (
                        <Typography variant="body2" color="text.secondary">
                          Expires: {formatDate(credential.expiry_date)}
                        </Typography>
                      )}
                    </Box>
                  }
                />
              </ListItem>
            ))}
          </List>
        )}
      </CardContent>
    </Card>
  );
};

export default IssuerCredentials; 