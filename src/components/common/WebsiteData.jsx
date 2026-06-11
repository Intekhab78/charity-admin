import React, { useEffect, useState } from 'react';
import { charityService } from '../../services/api';

const WebsiteData = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await charityService.list();
      setData(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="charity-data-grid">
      {data.length > 0 ? data.map(record => (
        <div key={record.id} className="charity-card">
          <div className="card-header">
            <h3>Record #{record.id}</h3>
            <span className="date-tag">{new Date(record.created_at).toLocaleDateString()}</span>
          </div>
          <div className="card-body">
            <pre>{JSON.stringify(record.data1, null, 2)}</pre>
          </div>
        </div>
      )) : <div className="no-data">
        {loading ? "Loading records..." : "No website records found."}
      </div>}
    </section>
  );
};

export default WebsiteData;
