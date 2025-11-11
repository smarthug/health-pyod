/**
 * 알고리즘 선택 컴포넌트
 */
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';
// import { AlgorithmInfo } from '../api.ts';

interface AlgoSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: any[];
}

export default function AlgoSelector({ value, onChange, options }: AlgoSelectorProps) {
  const handleChange = (event: any) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth>
      <InputLabel>Algorithm</InputLabel>
      <Select value={value} label="Algorithm" onChange={handleChange}>
        {options.map((algo) => (
          <MenuItem key={algo.id} value={algo.id}>
            {algo.name}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
