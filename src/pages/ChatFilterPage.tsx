import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { chatFilterRepository } from '../api/adminRepository';
import type { ChatFilterView } from '../api/types';

/**
 * The chat language filter's word list. Every chat message is checked by the
 * API, and any word on this list is replaced with asterisks before the other
 * team sees it - including in older messages, since the API masks again when
 * messages are read. Edits here take effect straight away.
 */
export function ChatFilterPage() {
  const [saved, setSaved] = useState<ChatFilterView | null>(null);
  const [words, setWords] = useState<string[]>([]);
  const [newWords, setNewWords] = useState('');
  const [filterText, setFilterText] = useState('');
  const [testText, setTestText] = useState('');
  const [testResult, setTestResult] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [savedMessage, setSavedMessage] = useState<string | null>(null);

  function apply(view: ChatFilterView) {
    setSaved(view);
    setWords(view.words);
  }

  useEffect(() => {
    chatFilterRepository.current().then((result) => {
      if (result.ok) apply(result.value);
      else setErrorMessage(result.message);
    });
  }, []);

  const unsaved = saved !== null && words.join('\n') !== saved.words.join('\n');
  const shown = useMemo(() => {
    const f = filterText.trim().toLowerCase();
    return f ? words.filter((w) => w.includes(f)) : words;
  }, [words, filterText]);

  function addWords() {
    // Commas, spaces or new lines all separate words, so a list can be pasted in.
    const added = newWords
      .split(/[\s,]+/)
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean);
    if (added.length === 0) return;
    setWords((current) => Array.from(new Set([...current, ...added])).sort());
    setNewWords('');
  }

  async function save() {
    setSaving(true);
    setErrorMessage(null);
    setSavedMessage(null);
    const result = await chatFilterRepository.save(words);
    setSaving(false);
    if (result.ok) {
      apply(result.value);
      setSavedMessage(`Saved - ${result.value.words.length} words are now masked in chat.`);
    } else {
      setErrorMessage(result.message);
    }
  }

  async function reset() {
    if (!window.confirm('Replace the list with the built-in starter list? Words you added will be removed.')) return;
    setSaving(true);
    setErrorMessage(null);
    setSavedMessage(null);
    const result = await chatFilterRepository.reset();
    setSaving(false);
    if (result.ok) {
      apply(result.value);
      setSavedMessage('Back to the built-in starter list.');
    } else {
      setErrorMessage(result.message);
    }
  }

  async function test() {
    if (!testText.trim()) return;
    const result = await chatFilterRepository.preview(testText);
    if (result.ok) setTestResult(result.value.masked ? result.value.text : `${result.value.text}  (nothing masked)`);
    else setErrorMessage(result.message);
  }

  return (
    <Stack spacing={2}>
      <Typography variant="h5" sx={{ fontWeight: 600 }}>
        Chat filter
      </Typography>
      <Typography variant="body2" color="text.secondary">
        Words on this list are replaced with asterisks (****) in team chat, on the web and in the app. Matching ignores
        capitals and sees through look-alike characters (sh1t, $hit), stretched letters (shiiit) and common endings
        (shits, shitting), but only whole words - "class" never matches "ass". Changes apply straight away, including to
        older messages.
      </Typography>

      {errorMessage && <Alert severity="error" onClose={() => setErrorMessage(null)}>{errorMessage}</Alert>}
      {savedMessage && <Alert severity="success" onClose={() => setSavedMessage(null)}>{savedMessage}</Alert>}
      {saved?.usingDefaults && (
        <Alert severity="info">
          This is the built-in starter list. Saving makes it your own list, which you can then change freely.
        </Alert>
      )}

      <Card variant="outlined">
        <CardContent>
          <Stack spacing={2}>
            <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
              <TextField
                label="Add words"
                helperText="One or more, separated by commas or spaces. Single words only."
                value={newWords}
                onChange={(e) => setNewWords(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addWords();
                  }
                }}
                size="small"
                fullWidth
              />
              <Box>
                <Button variant="outlined" onClick={addWords} disabled={!newWords.trim()}>
                  Add
                </Button>
              </Box>
            </Stack>

            <Stack direction="row" spacing={1} sx={{ alignItems: 'center' }}>
              <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
                {words.length} words
              </Typography>
              <TextField
                placeholder="Find a word"
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                size="small"
              />
            </Stack>

            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, maxHeight: 360, overflowY: 'auto' }}>
              {saved === null ? (
                <Typography variant="body2" color="text.secondary">
                  Loading…
                </Typography>
              ) : shown.length === 0 ? (
                <Typography variant="body2" color="text.secondary">
                  {words.length === 0 ? 'The list is empty, so nothing is masked.' : 'No words match.'}
                </Typography>
              ) : (
                shown.map((w) => (
                  <Chip key={w} label={w} size="small" onDelete={() => setWords((current) => current.filter((x) => x !== w))} />
                ))
              )}
            </Box>

            <Stack direction="row" spacing={1}>
              <Button variant="contained" onClick={save} disabled={saving || saved === null || (!unsaved && !saved.usingDefaults)}>
                {saving ? 'Saving…' : 'Save list'}
              </Button>
              <Button onClick={() => saved && setWords(saved.words)} disabled={!unsaved || saving}>
                Undo changes
              </Button>
              <Box sx={{ flexGrow: 1 }} />
              <Button color="warning" onClick={reset} disabled={saving || saved === null || saved.usingDefaults}>
                Restore starter list
              </Button>
            </Stack>
            {saved && !saved.usingDefaults && saved.updatedAt && (
              <Typography variant="caption" color="text.secondary">
                Last saved {new Date(saved.updatedAt).toLocaleString()}
              </Typography>
            )}
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined">
        <CardContent>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
            Try it
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
            Uses the saved list - save first to try words you've just added.
          </Typography>
          <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1}>
            <TextField
              placeholder="Type a message"
              value={testText}
              onChange={(e) => {
                setTestText(e.target.value);
                setTestResult(null);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') test();
              }}
              size="small"
              fullWidth
            />
            <Box>
              <Button variant="outlined" onClick={test} disabled={!testText.trim()}>
                Check
              </Button>
            </Box>
          </Stack>
          {testResult !== null && (
            <Typography variant="body2" sx={{ mt: 1.5, fontFamily: 'monospace' }}>
              {testResult}
            </Typography>
          )}
        </CardContent>
      </Card>
    </Stack>
  );
}
