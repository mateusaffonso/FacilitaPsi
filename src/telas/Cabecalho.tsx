import { Badge, Group, Image, Stack, Text, Title } from '@mantine/core'

export default function Cabecalho({ subtitulo }: { subtitulo?: string }) {
  return (
    <Group gap="sm" mb="lg" wrap="nowrap">
      <Image src={`${import.meta.env.BASE_URL}icone-192.png`} w={44} h={44} radius="md" alt="" />
      <Stack gap={0}>
        <Group gap="xs">
          <Title order={2} c="azul.7">
            Facilita Psi
          </Title>
          <Badge color="rose" variant="light">
            prova de conceito
          </Badge>
        </Group>
        {subtitulo && (
          <Text size="sm" c="dimmed">
            {subtitulo}
          </Text>
        )}
      </Stack>
    </Group>
  )
}
