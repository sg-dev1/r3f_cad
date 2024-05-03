import { useAppDispatch, useAppSelector } from '@/app/hooks';
import { selectLines, selectPoints, removeEntity, selectCircles } from '@/app/slices/sketchSlice';
import { setSelectedEntityId } from '@/app/slices/sketchToolStateSlice';
import EntityType, { GeometryType } from '@/app/types/EntityType';
import { DeleteOutlined } from '@ant-design/icons';
import { Popconfirm, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import React, { useEffect, useState } from 'react';

interface DataType extends EntityType {
  key: string;
}

const EntitiesTable = () => {
  const [tableData, setTableData] = useState<DataType[]>([]);
  const sketchPoints = useAppSelector(selectPoints);
  const sketchLines = useAppSelector(selectLines);
  const sketchCircles = useAppSelector(selectCircles);

  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const dispatch = useAppDispatch();

  useEffect(() => {
    const points = sketchPoints.map((pt) => ({ key: String(pt.id), id: pt.id, type: GeometryType.POINT }));
    const lines = sketchLines.map((line) => ({ key: String(line.id), id: line.id, type: GeometryType.LINE }));
    const circles = sketchCircles.map((circle) => ({
      key: String(circle.id),
      id: circle.id,
      type: GeometryType.CIRCLE,
    }));
    // TODO merge other types when available
    setTableData([...points, ...lines, ...circles].sort((a, b) => a.id - b.id));
  }, [sketchPoints, sketchLines]);

  const handleDelete = (record: DataType) => {
    console.log('delete', record);
    dispatch(removeEntity(record));
  };

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
      title: 'Type',
      dataIndex: 'type',
      key: 'type',
      width: '30%',
      render: (value: GeometryType) => {
        switch (value) {
          case GeometryType.POINT:
            return 'Point';
          case GeometryType.LINE:
            return 'Line';
          case GeometryType.CIRCLE:
            return 'Circle';
          case GeometryType.ARC:
            return 'Arc';
          default:
            return 'Unknown';
        }
      },
    },
    {
      title: '',
      dataIndex: 'action',
      key: 'action',
      width: '10%',
      render: (_, record) => {
        return (
          <Popconfirm title="Sure to delete?" onConfirm={() => handleDelete(record as DataType)}>
            <DeleteOutlined />
          </Popconfirm>
        );
      },
    },
  ];

  const handleRowClick = (record: DataType) => {
    setSelectedRowKey(record.key);
    dispatch(setSelectedEntityId(record.id));
  };

  return (
    <>
      <Table
        style={{ height: '50%', overflow: 'auto' }}
        //onChange={handleTableChange}
        pagination={false}
        scroll={{ y: '35vh' }}
        columns={columns}
        dataSource={tableData}
        title={() => <b>Entities</b>}
        //loading={dataLoading}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              handleRowClick(record);
            },
          };
        }}
        rowClassName={(record) => (record.key === selectedRowKey ? 'selected-row' : '')}
      />
    </>
  );
};

export default EntitiesTable;
