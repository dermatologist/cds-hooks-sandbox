import React from 'react';
import { shallow, mount } from 'enzyme';
import CommunicationMessage from '../../../src/components/CommunicationMessage/communication-message';

describe('CommunicationMessage component', () => {
  let props;

  beforeEach(() => {
    props = {
      value: '',
      onChange: jest.fn(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Basic rendering', () => {
    it('renders without crashing', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      expect(component.exists()).toBe(true);
    });

    it('renders the drop zone', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      expect(component.find('.drop-zone').length).toBe(1);
    });

    it('renders the textarea', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      expect(component.find('textarea').length).toBe(1);
    });

    it('renders upload prompt when no image is selected', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      expect(component.find('.upload-prompt').length).toBe(1);
    });

    it('does not render image preview when no image is selected', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      expect(component.find('.image-preview').length).toBe(0);
    });
  });

  describe('Text input handling', () => {
    it('updates text state on text change', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const textarea = component.find('textarea');
      textarea.simulate('change', { target: { value: 'Hello world' } });
      expect(component.state('text')).toBe('Hello world');
    });

    it('calls onChange with text value when text changes', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const textarea = component.find('textarea');
      textarea.simulate('change', { target: { value: 'Test message' } });
      expect(props.onChange).toHaveBeenCalledWith({
        target: { value: 'Test message' },
      });
    });

    it('handles empty text', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const textarea = component.find('textarea');
      textarea.simulate('change', { target: { value: '' } });
      expect(component.state('text')).toBe('');
    });
  });

  describe('File validation', () => {
    it('accepts valid image types', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const instance = component.instance();

      const validFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB

      // Mock FileReader
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null,
        result: 'data:image/png;base64,test',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      instance.handleFileSelect(validFile);

      // Trigger onload
      mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } });

      expect(component.state('error')).toBe(null);
    });

    it('rejects unsupported file types', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const instance = component.instance();

      const invalidFile = new File([''], 'test.pdf', { type: 'application/pdf' });
      instance.handleFileSelect(invalidFile);

      expect(component.state('error')).toContain('Unsupported file type');
    });

    it('rejects files larger than 5MB', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const instance = component.instance();

      const largeFile = new File([''], 'large.png', { type: 'image/png' });
      Object.defineProperty(largeFile, 'size', { value: 6 * 1024 * 1024 }); // 6MB

      instance.handleFileSelect(largeFile);

      expect(component.state('error')).toContain('exceeds maximum allowed size');
    });
  });

  describe('Image handling', () => {
    it('displays image preview when image is selected', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      component.setState({
        imageData: 'data:image/png;base64,test',
        imagePreview: 'data:image/png;base64,test',
        fileName: 'test.png',
      });

      expect(component.find('.image-preview').length).toBe(1);
      expect(component.find('.upload-prompt').length).toBe(0);
    });

    it('removes image when remove button is clicked', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      component.setState({
        imageData: 'data:image/png;base64,test',
        imagePreview: 'data:image/png;base64,test',
        fileName: 'test.png',
      });

      const instance = component.instance();
      instance.handleRemoveImage();

      expect(component.state('imageData')).toBe(null);
      expect(component.state('imagePreview')).toBe(null);
      expect(component.state('fileName')).toBe(null);
    });

    it('calls onChange with JSON payload when image is selected', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null,
        result: 'data:image/png;base64,test',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      const instance = component.instance();
      const validFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(validFile, 'size', { value: 1024 });

      instance.handleFileSelect(validFile);
      mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } });

      // Should have been called with JSON stringified payload
      const lastCall = props.onChange.mock.calls[props.onChange.mock.calls.length - 1];
      const payload = lastCall[0].target.value;
      const parsed = JSON.parse(payload);

      expect(parsed.image_url).toBe('data:image/png;base64,test');
      expect(parsed.text).toBe('');
    });

    it('includes text in JSON payload when both image and text are present', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const mockFileReader = {
        readAsDataURL: jest.fn(),
        onload: null,
        result: 'data:image/png;base64,test',
      };
      global.FileReader = jest.fn(() => mockFileReader);

      const instance = component.instance();

      // First set text
      component.find('textarea').simulate('change', { target: { value: 'Test message' } });

      // Then add image
      const validFile = new File([''], 'test.png', { type: 'image/png' });
      Object.defineProperty(validFile, 'size', { value: 1024 });

      instance.handleFileSelect(validFile);
      mockFileReader.onload({ target: { result: 'data:image/png;base64,test' } });

      // Should have JSON with both image and text
      const lastCall = props.onChange.mock.calls[props.onChange.mock.calls.length - 1];
      const payload = lastCall[0].target.value;
      const parsed = JSON.parse(payload);

      expect(parsed.image_url).toBe('data:image/png;base64,test');
      expect(parsed.text).toBe('Test message');
    });
  });

  describe('Drag and drop', () => {
    it('updates drag over state on drag over', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const dropZone = component.find('.drop-zone');

      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };

      dropZone.simulate('dragOver', mockEvent);

      expect(component.state('isDragOver')).toBe(true);
      expect(mockEvent.preventDefault).toHaveBeenCalled();
    });

    it('clears drag over state on drag leave', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      component.setState({ isDragOver: true });

      const dropZone = component.find('.drop-zone');
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
      };

      dropZone.simulate('dragLeave', mockEvent);

      expect(component.state('isDragOver')).toBe(false);
    });

    it('handles file drop', () => {
      const component = shallow(<CommunicationMessage {...props} />);
      const instance = component.instance();
      jest.spyOn(instance, 'handleFileSelect');

      const file = new File([''], 'test.png', { type: 'image/png' });
      const mockEvent = {
        preventDefault: jest.fn(),
        stopPropagation: jest.fn(),
        dataTransfer: {
          files: [file],
        },
      };

      const dropZone = component.find('.drop-zone');
      dropZone.simulate('drop', mockEvent);

      expect(mockEvent.preventDefault).toHaveBeenCalled();
      expect(component.state('isDragOver')).toBe(false);
      expect(instance.handleFileSelect).toHaveBeenCalledWith(file);
    });
  });

  describe('Value parsing', () => {
    it('parses plain text value', () => {
      const textProps = { ...props, value: 'Plain text message' };
      const component = shallow(<CommunicationMessage {...textProps} />);

      expect(component.state('text')).toBe('Plain text message');
      expect(component.state('imageData')).toBe(null);
    });

    it('parses JSON value with image', () => {
      const jsonValue = JSON.stringify({
        image_url: 'data:image/png;base64,test',
        text: 'Message with image',
      });
      const jsonProps = { ...props, value: jsonValue };
      const component = shallow(<CommunicationMessage {...jsonProps} />);

      expect(component.state('text')).toBe('Message with image');
      expect(component.state('imageData')).toBe('data:image/png;base64,test');
    });

    it('handles empty value', () => {
      const component = shallow(<CommunicationMessage {...props} />);

      expect(component.state('text')).toBe('');
      expect(component.state('imageData')).toBe(null);
    });
  });
});
