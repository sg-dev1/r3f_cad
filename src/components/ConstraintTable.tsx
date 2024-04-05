//
// TODOs
//  - edit constraints
//  - delete constraints
//  - improve display, e.g. only show relevant info (depends on constraint type)
//  - display constraint solver errors, e.g. errornous constraints written in red
//
import { useAppSelector } from '@/app/hooks';
import { selectConstraints } from '@/app/slices/sketchSlice';
import { ConstraintType, SlvsConstraints } from '@/app/types/Constraints';
import { Card, Table } from 'antd';
import { ColumnsType } from 'antd/es/table';
import { SorterResult } from 'antd/es/table/interface';
import React, { useEffect, useState } from 'react';

interface DataType extends ConstraintType {
  key: string;
}

const ConstraintTable = () => {
  const constraints = useAppSelector(selectConstraints);
  const [tableData, setTableData] = useState<DataType[]>([]);

  const [sortedInfo, setSortedInfo] = useState<SorterResult<DataType>>({});

  useEffect(() => {
    setTableData(constraints.map((constraint) => ({ ...constraint, key: String(constraint.id) })));
  }, [constraints]);

  const columns: ColumnsType<DataType> = [
    {
      title: 'Id',
      dataIndex: 'id',
      key: 'id',
      width: '15%',
      sorter: (a, b) => a.id - b.id,
      sortOrder: sortedInfo.columnKey === 'changedByUser' ? sortedInfo.order : null,
      //ellipsis: true,
    },
    {
      title: 'Type',
      dataIndex: 't',
      key: 't',
      width: '23%',
      render: (value: SlvsConstraints) => {
        switch (value) {
          case SlvsConstraints.SLVS_C_POINTS_COINCIDENT:
            return 'Coincident';
          case SlvsConstraints.SLVS_C_PT_PT_DISTANCE:
            return 'Point to Point Distance';
          case SlvsConstraints.SLVS_C_PT_PLANE_DISTANCE:
            return 'Point to Plane Distance';
          case SlvsConstraints.SLVS_C_PT_LINE_DISTANCE:
            return 'Point to Line Distance';
          case SlvsConstraints.SLVS_C_PT_FACE_DISTANCE:
            return 'Point to Face Distance';
          case SlvsConstraints.SLVS_C_PT_IN_PLANE:
            return 'Point in Plane';
          case SlvsConstraints.SLVS_C_PT_ON_LINE:
            return 'Point on Line';
          case SlvsConstraints.SLVS_C_PT_ON_FACE:
            return 'Point on Face';
          case SlvsConstraints.SLVS_C_EQUAL_LENGTH_LINES:
            return 'Equal Length Lines';
          case SlvsConstraints.SLVS_C_LENGTH_RATIO:
            return 'Length Ratio';
          case SlvsConstraints.SLVS_C_EQ_LEN_PT_LINE_D:
            return 'Equal Length Point Line Distance';
          case SlvsConstraints.SLVS_C_EQ_PT_LN_DISTANCES:
            return 'Equal Point Line Distances';
          case SlvsConstraints.SLVS_C_EQUAL_ANGLE:
            return 'Equal Angle';
          case SlvsConstraints.SLVS_C_EQUAL_LINE_ARC_LEN:
            return 'Equal Line Arc Length';
          case SlvsConstraints.SLVS_C_SYMMETRIC:
            return 'Symmetric';
          case SlvsConstraints.SLVS_C_SYMMETRIC_HORIZ:
            return 'Symmetric Horizontal';
          case SlvsConstraints.SLVS_C_SYMMETRIC_VERT:
            return 'Symmetric Vertical';
          case SlvsConstraints.SLVS_C_SYMMETRIC_LINE:
            return 'Symmetric Line';
          case SlvsConstraints.SLVS_C_AT_MIDPOINT:
            return 'Midpoint';
          case SlvsConstraints.SLVS_C_HORIZONTAL:
            return 'Horizontal';
          case SlvsConstraints.SLVS_C_VERTICAL:
            return 'Vertical';
          case SlvsConstraints.SLVS_C_DIAMETER:
            return 'Diameter';
          case SlvsConstraints.SLVS_C_PT_ON_CIRCLE:
            return 'Point on Circle';
          case SlvsConstraints.SLVS_C_SAME_ORIENTATION:
            return 'Same Orientation';
          case SlvsConstraints.SLVS_C_ANGLE:
            return 'Angle';
          case SlvsConstraints.SLVS_C_PARALLEL:
            return 'Parallel';
          case SlvsConstraints.SLVS_C_PERPENDICULAR:
            return 'Perpendicular';
          case SlvsConstraints.SLVS_C_ARC_LINE_TANGENT:
            return 'Arc Line Tangent';
          case SlvsConstraints.SLVS_C_CUBIC_LINE_TANGENT:
            return 'Cubic Line Tangent';
          case SlvsConstraints.SLVS_C_EQUAL_RADIUS:
            return 'Equal Radius';
          case SlvsConstraints.SLVS_C_PROJ_PT_DISTANCE:
            return 'Projection Point Distance';
          case SlvsConstraints.SLVS_C_WHERE_DRAGGED:
            return 'Where Dragged (Locked)';
          case SlvsConstraints.SLVS_C_CURVE_CURVE_TANGENT:
            return 'Curve Curve Tangent';
          case SlvsConstraints.SLVS_C_LENGTH_DIFFERENCE:
            return 'Length Difference';
          case SlvsConstraints.SLVS_C_ARC_ARC_LEN_RATIO:
            return 'Arc Arc Length Ratio';
          case SlvsConstraints.SLVS_C_ARC_LINE_LEN_RATIO:
            return 'Arc Line Length Ratio';
          case SlvsConstraints.SLVS_C_ARC_ARC_DIFFERENCE:
            return 'Arc Arc Difference';
          case SlvsConstraints.SLVS_C_ARC_LINE_DIFFERENCE:
            return 'Arc Line Difference';
          default:
            console.log('[SupportView] Got unknown constraint type for constraint with value: ' + value);
            return 'Unknown';
        }
      },
      filters: [
        {
          text: 'Coincident',
          value: SlvsConstraints.SLVS_C_POINTS_COINCIDENT,
        },
        {
          text: 'Point to Point Distance',
          value: SlvsConstraints.SLVS_C_PT_PT_DISTANCE,
        },
        {
          text: 'Horizontal',
          value: SlvsConstraints.SLVS_C_HORIZONTAL,
        },
        {
          text: 'Vertical',
          value: SlvsConstraints.SLVS_C_VERTICAL,
        },
      ],
      onFilter: (value, record) => record.t === value,
    },
    {
      title: 'Values',
      dataIndex: 'v',
      key: 'v',
      width: '62%',
      render: (value: number[]) => {
        return (
          <p>
            val={value[0]}, ptA={value[1]}, ptB={value[2]}, entityA={value[3]}, entityB={value[4]}
          </p>
        );
      },
    },
  ];

  return (
    <>
      <Card title="Constraints" bordered={false} style={{ height: '100%' }}>
        <Table
          //style={{ height: '100%' }}
          //onChange={handleTableChange}
          pagination={false}
          scroll={{ y: 500 }}
          columns={columns}
          dataSource={tableData}
          //loading={dataLoading}
        />
      </Card>
    </>
  );
};

export default ConstraintTable;
