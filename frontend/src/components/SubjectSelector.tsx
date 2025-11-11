/**
 * 피험자 선택 컴포넌트
 */
import { FormControl, InputLabel, Select, MenuItem } from '@mui/material';

interface SubjectSelectorProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
}

export default function SubjectSelector({ value, onChange, options }: SubjectSelectorProps) {
  const handleChange = (event: any) => {
    onChange(event.target.value);
  };

  return (
    <FormControl fullWidth>
      <InputLabel>Subject</InputLabel>
      <Select value={value} label="Subject" onChange={handleChange}>
        {options.map((subject) => (
          <MenuItem key={subject} value={subject}>
            {subject}
          </MenuItem>
        ))}
      </Select>
    </FormControl>
  );
}
