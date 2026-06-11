import React from 'react';
import { useParams } from 'react-router-dom';
import VendorPage from '../vendors/VendorPage';
import BatchCreationMasterPage from './BatchCreationMasterPage';
import StandardCreationMasterPage from './StandardCreationMasterPage';
import { masterConfig } from './creationMasterConfig';

const CreationMaster = () => {
  const { mode } = useParams();

  if (mode === 'vendor') return <VendorPage />;
  if (mode === 'batch' || !mode) return <BatchCreationMasterPage />;
  if (masterConfig[mode]) return <StandardCreationMasterPage config={masterConfig[mode]} />;

  return <BatchCreationMasterPage />;
};

export default CreationMaster;
