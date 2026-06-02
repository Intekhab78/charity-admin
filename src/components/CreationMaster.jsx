import React from 'react';
import { useParams } from 'react-router-dom';
import VendorManagement from './VendorManagement';
import BatchCreationMasterPage from './creation-master/BatchCreationMasterPage';
import StandardCreationMasterPage from './creation-master/StandardCreationMasterPage';
import { masterConfig } from './creation-master/creationMasterConfig';

const CreationMaster = () => {
  const { mode } = useParams();

  if (mode === 'vendor') return <VendorManagement />;
  if (mode === 'batch' || !mode) return <BatchCreationMasterPage />;
  if (masterConfig[mode]) return <StandardCreationMasterPage config={masterConfig[mode]} />;

  return <BatchCreationMasterPage />;
};

export default CreationMaster;
