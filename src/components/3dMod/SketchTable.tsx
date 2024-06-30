/** This component contains a list of all sketches presented to the user in the 3D modelling tool. */
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { deleteSketch, selectSketchs, setActiveSketch } from '@/app/slices/sketchSlice';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Button, Flex, Popconfirm, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';

interface DataType {
  key: string;
  id: number;
  name: string;
}

const SketchTable = () => {
  const [tableData, setTableData] = useState<DataType[]>([]);
  const sketches = useAppSelector(selectSketchs);

  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const values: DataType[] = Object.entries(sketches).map(([key, value]) => ({
      key: String(value.id),
      id: value.id,
      name: value.name,
    }));
    setTableData(values);
  }, [sketches]);

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
            <Button type="text" onClick={() => handleUpdate(record as DataType)}>
              <EditOutlined />
            </Button>
            <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record as DataType)}>
              <DeleteOutlined />
            </Popconfirm>
          </Flex>
        );
      },
    },
  ];

  const handleUpdate = (record: DataType) => {
    console.log('update', record);
    dispatch(setActiveSketch(record.id));
  };

  const handleDelete = (record: DataType) => {
    console.log('delete', record);
    dispatch(deleteSketch(record.id));
  };

  const handleRowClick = (record: DataType) => {
    setSelectedRowKey(record.key);
    //dispatch(setSelectedEntityId(record.id));
  };

  return (
    <Table
      style={{ height: '100%', overflow: 'auto' }}
      pagination={false}
      //scroll={{ y: '35vh' }}
      columns={columns}
      dataSource={tableData}
      title={() => <b>Sketchs</b>}
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

export default SketchTable;
