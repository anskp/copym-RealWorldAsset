import React, { useState, useEffect } from 'react';
import { Container, Grid, Paper, Typography, Box, CircularProgress, Divider } from '@mui/material';
import axios from 'axios';
import IssuerCredentials from '../components/IssuerCredentials';

const IssuerDashboard = () => {
  const [issuerData, setIssuerData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchIssuerData();
  }, []);

  const fetchIssuerData = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/issuer/dashboard');
      setIssuerData(response.data);
    } catch (err) {
      console.error('Error fetching issuer data:', err);
      setError('Failed to load issuer data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box 
        display="flex" 
        justifyContent="center" 
        alignItems="center" 
        minHeight="80vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography variant="h6" color="error" gutterBottom>
          {error}
        </Typography>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        {/* Issuer Profile Information */}
        <Grid item xs={12}>
          <Paper sx={{ p: 3, display: 'flex', flexDirection: 'column' }}>
            <Typography variant="h4" gutterBottom>
              Issuer Dashboard
            </Typography>
            
            {issuerData && (
              <>
                <Typography variant="h6" gutterBottom>
                  {issuerData.company_name}
                </Typography>
                
                <Box sx={{ mb: 2 }}>
                  <Typography variant="body1">
                    Registration Number: {issuerData.company_registration_number || 'Not provided'}
                  </Typography>
                  <Typography variant="body1">
                    Jurisdiction: {issuerData.jurisdiction || 'Not provided'}
                  </Typography>
                  <Typography variant="body1">
                    Verification Status: {issuerData.verification_status ? 'Verified' : 'Not Verified'}
                  </Typography>
                </Box>
                
                <Divider sx={{ my: 2 }} />
                
                <Typography variant="body2" color="text.secondary">
                  Account: {issuerData.first_name} {issuerData.last_name} ({issuerData.email})
                </Typography>
              </>
            )}
          </Paper>
        </Grid>

        {/* Credentials Section */}
        <Grid item xs={12}>
          <IssuerCredentials />
        </Grid>
      </Grid>
    </Container>
  );
};

export default IssuerDashboard; 