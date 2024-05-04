//
// Future TODOs:
//  - If new constraints are supported the way to (1) display it, (2) edit it needs to be updated
//  - Per default the whole v (Values) array is shown - parts of it are not relevant for a particular constraint
//
import { useAppDispatch, useAppSelector } from '@/app/hooks';
import {
  deleteConstraint,
  selectConstraints,
  selectLastSolverFailedConstraints,
  updateConstraint,
} from '@/app/slices/sketchSlice';
import { ConstraintType, SlvsConstraints } from '@/app/types/Constraints';
import type { GetRef, InputRef } from 'antd';
import { Form, Input, Popconfirm, Table } from 'antd';
import { SorterResult } from 'antd/es/table/interface';
import React, { useContext, useEffect, useRef, useState } from 'react';

import '../app/globals.css';
import { DeleteOutlined } from '@ant-design/icons';
import { selectSelectedConstraintId, setSelectedConstraintId } from '@/app/slices/sketchToolStateSlice';

// ---
// Base on Editable Cells example
// https://ant.design/components/table#components-table-demo-edit-cell
// https://codepen.io/pen?editors=0010
// https://stackblitz.com/run?file=index.css,demo.tsx

type FormInstance<T> = GetRef<typeof Form<T>>;

const EditableContext = React.createContext<FormInstance<any> | null>(null);

interface EditableRowProps {
  index: number;
}

const EditableRow: React.FC<EditableRowProps> = ({ index, ...props }) => {
  const [form] = Form.useForm();
  return (
    <Form form={form} component={false}>
      <EditableContext.Provider value={form}>
        <tr {...props} />
      </EditableContext.Provider>
    </Form>
  );
};

interface EditableCellProps {
  title: React.ReactNode;
  editable: boolean;
  children: React.ReactNode;
  dataIndex: keyof DataType;
  record: DataType;
  handleSave: (record: DataType) => void;
}

const EditableCell: React.FC<EditableCellProps> = ({
  title,
  editable,
  children,
  dataIndex,
  record,
  handleSave,
  ...restProps
}) => {
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<InputRef>(null);
  const form = useContext(EditableContext)!;

  useEffect(() => {
    if (editing) {
      inputRef.current?.focus();
    }
  }, [editing]);

  const toggleEdit = () => {
    // title: "Values", e.g. title of header
    // dataIndex: "v", as specified in columns array
    // record: the whole record of ConstraintType type
    // children: The html (ReactNode) return by render (for the v dataIndex) as specified in the columns arry
    //console.log('toggleEdit', title, dataIndex, record, children);

    setEditing(!editing);
    form.setFieldsValue({ [dataIndex]: record[dataIndex] });
  };

  const save = async () => {
    try {
      let values = await form.validateFields();
      // Note: values contains the whole object as record

      //console.log(typeof values[dataIndex]);
      if (typeof values[dataIndex] === 'string') {
        //console.log('values are string');
        const elements = values[dataIndex].split(',');
        values[dataIndex] = elements.map((elem: string) => {
          if ('zero' === elem) {
            return elem;
          }
          return parseFloat(elem);
        });
      }

      //console.log('save: values', values);

      toggleEdit();
      handleSave({ ...record, ...values });
    } catch (errInfo) {
      console.log('Save failed:', errInfo);
    }
  };

  let childNode = children;

  if (editable) {
    childNode = editing ? (
      <Form.Item
        style={{ margin: 0 }}
        name={dataIndex}
        rules={[
          {
            required: true,
            message: `${title} is required.`,
          },
        ]}
      >
        <Input ref={inputRef} onPressEnter={save} onBlur={save} />
      </Form.Item>
    ) : (
      <div className="editable-cell-value-wrap" style={{ paddingRight: 24 }} onClick={toggleEdit}>
        {children}
      </div>
    );
  }

  return <td {...restProps}>{childNode}</td>;
};

type EditableTableProps = Parameters<typeof Table>[0];

type ColumnTypes = Exclude<EditableTableProps['columns'], undefined>;

// ---

interface DataType extends ConstraintType {
  key: string;
  isError: boolean;
}

const ConstraintTable = () => {
  const constraints = useAppSelector(selectConstraints);
  const [tableData, setTableData] = useState<DataType[]>([]);
  const sketchLastSolverFailedConstraints = useAppSelector(selectLastSolverFailedConstraints);
  const sketchSelectedConstraintId = useAppSelector(selectSelectedConstraintId);

  const [selectedRowKey, setSelectedRowKey] = useState<string | null>(null);
  const [sortedInfo, setSortedInfo] = useState<SorterResult<DataType>>({});
  const dispatch = useAppDispatch();

  useEffect(() => {
    setSelectedRowKey(String(sketchSelectedConstraintId));
  }, [sketchSelectedConstraintId]);

  useEffect(() => {
    setTableData(
      constraints.map((constraint) => ({
        ...constraint,
        key: String(constraint.id),
        isError: sketchLastSolverFailedConstraints.indexOf(constraint.id) !== -1,
      }))
    );
  }, [constraints, sketchLastSolverFailedConstraints]);

  const handleDelete = (record: DataType) => {
    dispatch(deleteConstraint(record));
  };

  const defaultColumns: (ColumnTypes[number] & { editable?: boolean; dataIndex: string })[] = [
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
      width: '52%',
      render: (value: number[], record) => {
        let displayData;
        switch (record.t) {
          case SlvsConstraints.SLVS_C_POINTS_COINCIDENT:
            displayData = 'ptA=' + value[1] + ', ptB=' + value[2];
            break;
          case SlvsConstraints.SLVS_C_PT_PT_DISTANCE:
            displayData = 'val=' + value[0] + ', ptA=' + value[1] + ', ptB=' + value[2];
            break;
          case SlvsConstraints.SLVS_C_HORIZONTAL:
            displayData = 'entityA=' + value[3];
            break;
          case SlvsConstraints.SLVS_C_VERTICAL:
            displayData = 'entityA=' + value[3];
            break;
          default:
            displayData =
              'val=' +
              value[0] +
              ', ptA=' +
              value[1] +
              ', ptB=' +
              value[2] +
              ', entityA=' +
              value[3] +
              ', entityB=' +
              value[4];
        }

        return <p>{displayData}</p>;
      },
      editable: true,
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

  const handleSave = (row: DataType) => {
    //console.log('handleSave', row);
    const { ['key']: removedKey, ['isError']: _, ...constraintData } = row;
    dispatch(updateConstraint(constraintData));
  };

  const columns = defaultColumns.map((col) => {
    if (!col.editable) {
      return col;
    }
    return {
      ...col,
      onCell: (record: DataType) => ({
        record,
        editable: col.editable,
        dataIndex: col.dataIndex,
        title: col.title,
        handleSave,
      }),
    };
  });

  const handleRowClick = (record: DataType) => {
    setSelectedRowKey(record.key);
    dispatch(setSelectedConstraintId(record.id));
  };

  return (
    <>
      <Table
        style={{ height: '50%', overflow: 'auto' }}
        //style={{ overflow: 'scroll' }}
        //onChange={handleTableChange}
        components={{
          body: {
            row: EditableRow,
            cell: EditableCell,
          },
        }}
        rowClassName={(record, index) =>
          record.isError ? 'red-text' : record.key === selectedRowKey ? 'selected-row' : ''
        }
        pagination={false}
        scroll={{ y: '35vh' }}
        columns={columns as ColumnTypes}
        dataSource={tableData}
        title={() => <b>Constraints</b>}
        //loading={dataLoading}
        onRow={(record, rowIndex) => {
          return {
            onClick: (event) => {
              handleRowClick(record as DataType);
            },
          };
        }}
      />
    </>
  );
};

export default ConstraintTable;
