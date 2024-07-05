/** This component contains a list of all geometries presented to the user in the 3D modelling tool.
 *  Was a quick way to implement (B016) hiding of 3D geometry.
 *  Will in future be replaced by tree view (B003)
 */
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { removeGeometries, select3dGeometries, setGeometryVisibility } from '@/app/slices/geom3dSlice';
import { Button, Flex, Popconfirm } from 'antd';
import Table, { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';

interface DataType {
  key: string;
  id: number;
  name: string;
}

const Geom3DTable = () => {
  const [tableData, setTableData] = useState<DataType[]>([]);
  const geometries3d = useAppSelector(select3dGeometries);

  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const values: DataType[] = Object.entries(geometries3d).map(([key, value]) => ({
      key: String(value.id),
      id: value.id,
      name: value.name,
    }));
    setTableData(values);
  }, [geometries3d]);

  // ---

  const columns: ColumnsType<DataType> = [
    {
      title: 'Id',
      dataIndex: 'id',
      key: 'id',
      width: '15%',
      //sorter: (a, b) => a.id - b.id,
      //sortOrder: sortedInfo.columnKey === 'changedByUser' ? sortedInfo.order : null,
      //ellipsis: true,
    },
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      width: '75%',
      //sorter: (a, b) => a.id - b.id,
      //sortOrder: sortedInfo.columnKey === 'changedByUser' ? sortedInfo.order : null,
      //ellipsis: true,
    },
    {
      title: '',
      dataIndex: 'action',
      key: 'action',
      width: '10%',
      render: (_, record) => {
        return (
          <Flex>
            {/* <Button style={{ padding: '3px 5px' }} type="text" onClick={() => handleUpdate(record)}>
              <span className="material-symbols-outlined">edit</span>
            </Button> */}
            <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record)}>
              <span style={{ padding: '3px 5px' }} className="material-symbols-outlined">
                delete
              </span>
            </Popconfirm>
            <Button style={{ padding: '3px 5px' }} type="text" onClick={() => handleVisibility(record)}>
              <span className="material-symbols-outlined">
                {geometries3d[record.id]?.isVisible ? 'visibility_off' : 'visibility'}
              </span>
            </Button>
          </Flex>
        );
      },
    },
  ];

  /*
  // Note - here extrude length could be manipulated (not needed now)
  const handleUpdate = (record: DataType) => {
    console.log('update', record);
    //dispatch(setActiveSketch(record.id));
  };
  */

  const handleDelete = (record: DataType) => {
    console.log('delete', record);
    dispatch(removeGeometries({ ids: [record.id] }));
  };

  const handleVisibility = (record: DataType) => {
    console.log('visibility', record);
    dispatch(setGeometryVisibility({ id: record.id, visible: !geometries3d[record.id].isVisible }));
  };

  const handleRowClick = (record: DataType) => {
    setSelectedRowKey(record.key);
    //dispatch(setSelectedSketch(record.id));
  };

  return (
    <Table
      style={{ overflow: 'auto' }}
      pagination={false}
      //scroll={{ y: '35vh' }}
      columns={columns}
      dataSource={tableData}
      title={() => <b>Geometries</b>}
      onRow={(record, rowIndex) => {
        return {
          onClick: (event) => {
            handleRowClick(record);
          },
        };
      }}
      rowClassName={(record) => (record.key === selectedRowKey ? 'selected-row' : '')}
    />
  );
};

export default Geom3DTable;
