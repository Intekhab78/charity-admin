import { creationMasterService } from '../../services/api';

export const masterConfig = {
  animal: {
    title: 'Animal Master',
    addLabel: 'Add Animal',
    tableName: 'animal',
    service: creationMasterService.animals,
    initial: { item_name: '', item_code: '', item_description: '', itemprice: '', departname: '', status: 1 },
    fields: [
      ['item_name', 'Animal Name', 'text'],
      ['item_code', 'Animal Code', 'text'],
      ['item_description', 'Description', 'text'],
      ['itemprice', 'Default Rate INR', 'number'],
      ['departname', 'Department', 'text'],
      ['status', 'Status', 'select']
    ],
    columns: [
      ['item_name', 'Animal Name'],
      ['item_code', 'Animal Code'],
      ['itemprice', 'Rate INR'],
      ['departname', 'Department'],
      ['status', 'Status']
    ]
  },
  location: {
    title: 'Location Master',
    addLabel: 'Add Location',
    tableName: 'location',
    service: creationMasterService.locations,
    initial: { locname: '', loccode: '', locdesclong: '', ccurrency: '', cacurrency: '', status: 1 },
    fields: [
      ['locname', 'Location Name', 'text'],
      ['loccode', 'Location Code', 'text'],
      ['locdesclong', 'Description', 'text'],
      ['ccurrency', 'Currency', 'text'],
      ['cacurrency', 'Online Currency', 'text'],
      ['status', 'Status', 'select']
    ],
    columns: [
      ['locname', 'Location Name'],
      ['loccode', 'Location Code'],
      ['locdesclong', 'Description'],
      ['ccurrency', 'Currency'],
      ['status', 'Status']
    ]
  },
  currency: {
    title: 'Currency Master',
    addLabel: 'Add Currency',
    tableName: 'currency',
    service: creationMasterService.currencies,
    initial: { currency_name: '', currency_code: '', symbol: '', rate_inr: '', status: 1 },
    fields: [
      ['currency_name', 'Currency Name', 'text'],
      ['currency_code', 'Currency Code', 'text'],
      ['symbol', 'Symbol', 'text'],
      ['rate_inr', 'Rate INR', 'number'],
      ['status', 'Status', 'select']
    ],
    columns: [
      ['currency_name', 'Currency Name'],
      ['currency_code', 'Code'],
      ['symbol', 'Symbol'],
      ['rate_inr', 'Rate INR'],
      ['status', 'Status']
    ]
  }
};

export const batchColumns = [
  ['batch_number', 'Batchcode'],
  ['animal_name', 'Animalname'],
  ['animal_code', 'Addanimalcode'],
  ['location_name', 'Locationname'],
  ['location_code', 'Addlocationcode'],
  ['currency_id_inr', 'Addcurrencyidinr'],
  ['currency_id_online', 'Addcurrencyidinronline'],
  ['currency_code_online', 'Addcurrencycodeinronline'],
  ['rate_inr', 'Rate INR'],
  ['rate_usd', 'Rate USD']
];

export const batchInitial = {
  item_id: '',
  animal_name: '',
  animal_code: '',
  qty: '',
  batch_number: '',
  location_id: '',
  location_name: '',
  location_code: '',
  currency_id_inr: '',
  currency_id_online: '',
  currency_code_online: '',
  rate_inr: '',
  rate_inronline: '',
  rate_usd: ''
};
